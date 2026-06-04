import {
  coachClientsCollection,
  exercisesCollection,
  planAssignmentsCollection,
  progressLogsCollection,
  setLogsCollection,
  tipsCollection,
} from '@/db/collections';
import { sessionStore } from '@/stores/sessionStore';
import { supabase } from '@/config/supabase';
import { uuidv4 } from '@/lib/uuid';
import { toast } from '@/components/feedback/Toast';
import { extractVideoId, toWatchUrl } from '@/lib/youtube';

type Transaction = { isPersisted: { promise: Promise<unknown> } };

function requireUserId(): string {
  const id = sessionStore.state.profile?.id;
  if (!id) throw new Error('No authenticated profile in session store');
  return id;
}

function nowIso(): string {
  return new Date().toISOString();
}

/** Awaits an optimistic transaction; on rollback surfaces the standard toast and rethrows. */
async function commit(run: () => Transaction): Promise<void> {
  const tx = run();
  try {
    await tx.isPersisted.promise;
  } catch (error) {
    toast.error('mutation.failed');
    throw error;
  }
}

export interface CreateExerciseInput {
  name: string;
  description?: string | null;
  videoUrl?: string | null;
  muscleGroup?: string | null;
  equipment?: string | null;
}

export async function createExercise(input: CreateExerciseInput): Promise<string> {
  const coachId = requireUserId();
  const id = uuidv4();
  const ts = nowIso();
  const videoId = input.videoUrl ? extractVideoId(input.videoUrl) : null;
  await commit(() =>
    exercisesCollection.insert({
      id,
      coach_id: coachId,
      name: input.name,
      description: input.description ?? null,
      video_url: videoId ? toWatchUrl(videoId) : null,
      muscle_group: input.muscleGroup ?? null,
      equipment: input.equipment ?? null,
      created_at: ts,
      updated_at: ts,
    }),
  );
  return id;
}

export interface AssignPlanInput {
  planId: string;
  clientId: string;
  startDate: string;
  replaceAssignmentId?: string;
}

export async function assignPlan(input: AssignPlanInput): Promise<string> {
  requireUserId();
  if (input.replaceAssignmentId) {
    const replaceId = input.replaceAssignmentId;
    await commit(() =>
      planAssignmentsCollection.update(replaceId, (draft) => {
        draft.status = 'completed';
      }),
    );
  }
  const id = uuidv4();
  const ts = nowIso();
  await commit(() =>
    planAssignmentsCollection.insert({
      id,
      plan_id: input.planId,
      client_id: input.clientId,
      start_date: input.startDate,
      status: 'active',
      created_at: ts,
      updated_at: ts,
    }),
  );
  return id;
}

export interface SetEntry {
  exerciseId: string;
  setNumber: number;
  repsDone?: number | null;
  weightDone?: number | null;
}

export interface LogProgressInput {
  assignmentId: string;
  planDayId: string;
  perceivedEffort?: number | null;
  notes?: string | null;
  completedAt?: string;
  sets?: SetEntry[];
}

export async function logProgress(input: LogProgressInput): Promise<string> {
  const clientId = requireUserId();
  const logId = uuidv4();
  const ts = nowIso();
  await commit(() =>
    progressLogsCollection.insert({
      id: logId,
      assignment_id: input.assignmentId,
      plan_day_id: input.planDayId,
      client_id: clientId,
      completed_at: input.completedAt ?? ts,
      notes: input.notes ?? null,
      perceived_effort: input.perceivedEffort ?? null,
      created_at: ts,
      updated_at: ts,
    }),
  );
  for (const set of input.sets ?? []) {
    await commit(() =>
      setLogsCollection.insert({
        id: uuidv4(),
        progress_log_id: logId,
        exercise_id: set.exerciseId,
        set_number: set.setNumber,
        reps_done: set.repsDone ?? null,
        weight_done: set.weightDone ?? null,
        created_at: ts,
      }),
    );
  }
  return logId;
}

export async function postTip(body: string): Promise<string> {
  const coachId = requireUserId();
  const id = uuidv4();
  await commit(() =>
    tipsCollection.insert({ id, coach_id: coachId, body, created_at: nowIso() }),
  );
  return id;
}

/**
 * Redeems an invite via the atomic `redeem_invite` RPC (arg name `invite_code`).
 * Re-redeeming raises `23505`; invalid/expired raises `22023` — both surface as a
 * thrown error the onboarding step maps to an inline message.
 */
export async function redeemInvite(code: string): Promise<void> {
  const { error } = await supabase.rpc('redeem_invite', { invite_code: code });
  if (error) {
    toast.error('mutation.failed');
    throw error;
  }
  await coachClientsCollection.utils.refetch();
}
