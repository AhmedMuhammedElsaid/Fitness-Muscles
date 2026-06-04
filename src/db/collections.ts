import { createCollection } from '@tanstack/db';
import { queryCollectionOptions } from '@tanstack/query-db-collection';
import { queryClient } from '@/config/queryClient';
import { supabase } from '@/config/supabase';
import type { Database, Tables, TablesInsert } from '@/types/db';

type TableName = keyof Database['public']['Tables'];

interface DefineOptions {
  /** When set, inserts become upserts on these conflict columns (e.g. `'assignment_id,plan_day_id'`). */
  insertConflict?: string;
}

/**
 * Builds a TanStack DB collection backed by a Supabase table.
 *
 * `queryFn` re-reads the session at call time (NOT at module init) so a token
 * refresh propagates to subsequent fetches; the `sessionStore` listener invalidates
 * these queries on `TOKEN_REFRESHED`/`SIGNED_OUT`.
 */
function defineCollection<TName extends TableName>(
  table: TName,
  pk: ReadonlyArray<keyof Tables<TName> & string>,
  options: DefineOptions = {},
) {
  type Row = Tables<TName>;
  type Insert = TablesInsert<TName>;

  const getKey = (item: Row): string => pk.map((col) => String(item[col])).join(':');

  return createCollection(
    queryCollectionOptions<Row>({
      id: table,
      queryKey: [table],
      queryClient,
      getKey,
      queryFn: async () => {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) return [];
        const { data, error } = await supabase.from(table).select('*');
        if (error) throw error;
        return (data ?? []) as Row[];
      },
      onInsert: async ({ transaction }) => {
        const rows = transaction.mutations.map((m) => m.modified) as Insert[];
        const query = supabase.from(table);
        const { error } = options.insertConflict
          ? await query.upsert(rows, { onConflict: options.insertConflict })
          : await query.insert(rows);
        if (error) throw error;
      },
      onUpdate: async ({ transaction }) => {
        for (const mutation of transaction.mutations) {
          const original = mutation.original as Row;
          const filter = Object.fromEntries(pk.map((col) => [col, original[col]]));
          const { error } = await supabase
            .from(table)
            .update(mutation.changes as Partial<Row>)
            .match(filter);
          if (error) throw error;
        }
      },
      onDelete: async ({ transaction }) => {
        for (const mutation of transaction.mutations) {
          const original = mutation.original as Row;
          const filter = Object.fromEntries(pk.map((col) => [col, original[col]]));
          const { error } = await supabase.from(table).delete().match(filter);
          if (error) throw error;
        }
      },
    }),
  );
}

export const exercisesCollection = defineCollection('exercises', ['id']);
export const workoutsCollection = defineCollection('workouts', ['id']);
export const workoutExercisesCollection = defineCollection('workout_exercises', [
  'workout_id',
  'position',
]);
export const plansCollection = defineCollection('plans', ['id']);
export const planDaysCollection = defineCollection('plan_days', ['id']);
export const planAssignmentsCollection = defineCollection('plan_assignments', ['id']);
export const progressLogsCollection = defineCollection('progress_logs', ['id'], {
  insertConflict: 'assignment_id,plan_day_id',
});
export const setLogsCollection = defineCollection('set_logs', ['id'], {
  insertConflict: 'progress_log_id,exercise_id,set_number',
});
export const tipsCollection = defineCollection('tips', ['id']);
export const coachClientsCollection = defineCollection('coach_clients', ['coach_id', 'client_id']);

const REALTIME_TABLES: ReadonlyArray<{ table: TableName; refetch: () => Promise<unknown> }> = [
  { table: 'exercises', refetch: () => exercisesCollection.utils.refetch() },
  { table: 'workouts', refetch: () => workoutsCollection.utils.refetch() },
  { table: 'workout_exercises', refetch: () => workoutExercisesCollection.utils.refetch() },
  { table: 'plans', refetch: () => plansCollection.utils.refetch() },
  { table: 'plan_days', refetch: () => planDaysCollection.utils.refetch() },
  { table: 'plan_assignments', refetch: () => planAssignmentsCollection.utils.refetch() },
  { table: 'progress_logs', refetch: () => progressLogsCollection.utils.refetch() },
  { table: 'set_logs', refetch: () => setLogsCollection.utils.refetch() },
  { table: 'tips', refetch: () => tipsCollection.utils.refetch() },
  { table: 'coach_clients', refetch: () => coachClientsCollection.utils.refetch() },
];

/**
 * Subscribes every realtime collection to its Supabase `postgres_changes` stream.
 * On any change the collection refetches (RLS-scoped), so a coach's write surfaces
 * on the client within ~1s. Realtime broadcasts respect RLS, so each role only sees
 * its own rows. Call once after sign-in; the returned function tears the channels down.
 */
export function subscribeRealtime(): () => void {
  const channels = REALTIME_TABLES.map(({ table, refetch }) =>
    supabase
      .channel(`rt:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        void refetch();
      })
      .subscribe(),
  );
  return () => {
    for (const channel of channels) void supabase.removeChannel(channel);
  };
}
