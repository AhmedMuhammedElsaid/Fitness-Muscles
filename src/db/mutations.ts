import {
  coachClientsCollection,
  exercisesCollection,
  planAssignmentsCollection,
  planDaysCollection,
  plansCollection,
  progressLogsCollection,
  setLogsCollection,
  tipsCollection,
  workoutExercisesCollection,
  workoutsCollection,
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

// ─── Exercises ────────────────────────────────────────────────────────────────

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

export type UpdateExerciseInput = Partial<CreateExerciseInput>;

export async function updateExercise(id: string, input: UpdateExerciseInput): Promise<void> {
  const ts = nowIso();
  const videoId = input.videoUrl !== undefined
    ? (input.videoUrl ? extractVideoId(input.videoUrl) : null)
    : undefined;
  const changes: Record<string, unknown> = { updated_at: ts };
  if (input.name !== undefined) changes.name = input.name;
  if (input.description !== undefined) changes.description = input.description ?? null;
  if (videoId !== undefined) changes.video_url = videoId ? toWatchUrl(videoId) : null;
  if (input.muscleGroup !== undefined) changes.muscle_group = input.muscleGroup ?? null;
  if (input.equipment !== undefined) changes.equipment = input.equipment ?? null;
  await commit(() => exercisesCollection.update(id, (draft) => Object.assign(draft, changes)));
}

export async function deleteExercise(id: string): Promise<void> {
  await commit(() => exercisesCollection.delete(id));
}

// ─── Workouts ─────────────────────────────────────────────────────────────────

export interface CreateWorkoutInput {
  name: string;
  notes?: string | null;
}

export async function createWorkout(input: CreateWorkoutInput): Promise<string> {
  const coachId = requireUserId();
  const id = uuidv4();
  const ts = nowIso();
  await commit(() =>
    workoutsCollection.insert({
      id,
      coach_id: coachId,
      name: input.name,
      notes: input.notes ?? null,
      created_at: ts,
      updated_at: ts,
    }),
  );
  return id;
}

export type UpdateWorkoutInput = Partial<CreateWorkoutInput>;

export async function updateWorkout(id: string, input: UpdateWorkoutInput): Promise<void> {
  const ts = nowIso();
  const changes: Record<string, unknown> = { updated_at: ts };
  if (input.name !== undefined) changes.name = input.name;
  if (input.notes !== undefined) changes.notes = input.notes ?? null;
  await commit(() => workoutsCollection.update(id, (draft) => Object.assign(draft, changes)));
}

export async function deleteWorkout(id: string): Promise<void> {
  await commit(() => workoutsCollection.delete(id));
}

export interface WorkoutExerciseInput {
  workoutId: string;
  exerciseId: string;
  position: number;
  sets?: number;
  reps?: number;
  restSeconds?: number;
  weightHint?: string | null;
}

export async function addWorkoutExercise(input: WorkoutExerciseInput): Promise<void> {
  await commit(() =>
    workoutExercisesCollection.insert({
      workout_id: input.workoutId,
      exercise_id: input.exerciseId,
      position: input.position,
      sets: input.sets ?? 3,
      reps: input.reps ?? 10,
      rest_seconds: input.restSeconds ?? 60,
      weight_hint: input.weightHint ?? null,
    }),
  );
}

export async function removeWorkoutExercise(workoutId: string, position: number): Promise<void> {
  await commit(() => workoutExercisesCollection.delete(`${workoutId}:${position}`));
}

// ─── Plans ────────────────────────────────────────────────────────────────────

export interface CreatePlanInput {
  name: string;
  durationWeeks: number;
  description?: string | null;
}

export async function createPlan(input: CreatePlanInput): Promise<string> {
  const coachId = requireUserId();
  const id = uuidv4();
  const ts = nowIso();
  await commit(() =>
    plansCollection.insert({
      id,
      coach_id: coachId,
      name: input.name,
      duration_weeks: input.durationWeeks,
      description: input.description ?? null,
      created_at: ts,
      updated_at: ts,
    }),
  );
  return id;
}

export interface SetPlanDayInput {
  planId: string;
  weekNumber: number;
  dayOfWeek: number;
  workoutId: string | null;
}

export async function setPlanDay(input: SetPlanDayInput): Promise<string> {
  const id = uuidv4();
  await commit(() =>
    planDaysCollection.insert({
      id,
      plan_id: input.planId,
      week_number: input.weekNumber,
      day_of_week: input.dayOfWeek,
      workout_id: input.workoutId,
    }),
  );
  return id;
}

export async function clearPlanDay(planDayId: string): Promise<void> {
  await commit(() => planDaysCollection.delete(planDayId));
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

// ─── Clients ──────────────────────────────────────────────────────────────────

export async function removeClient(coachId: string, clientId: string): Promise<void> {
  await commit(() =>
    coachClientsCollection.update(`${coachId}:${clientId}`, (draft) => {
      draft.status = 'removed';
    }),
  );
}

// ─── Progress / Sets ──────────────────────────────────────────────────────────

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

// ─── Tips ─────────────────────────────────────────────────────────────────────

export async function postTip(body: string): Promise<string> {
  const coachId = requireUserId();
  const id = uuidv4();
  await commit(() =>
    tipsCollection.insert({ id, coach_id: coachId, body, created_at: nowIso() }),
  );
  return id;
}

export async function deleteTip(id: string): Promise<void> {
  await commit(() => tipsCollection.delete(id));
}

// ─── Onboarding ───────────────────────────────────────────────────────────────

/**
 * Redeems an invite via the atomic `redeem_invite` RPC (arg name `invite_code`).
 * Re-redeeming raises `23505`; invalid/expired raises `22023`.
 */
export async function redeemInvite(code: string): Promise<void> {
  const { error } = await supabase.rpc('redeem_invite', { invite_code: code });
  if (error) {
    toast.error('mutation.failed');
    throw error;
  }
  await coachClientsCollection.utils.refetch();
}
