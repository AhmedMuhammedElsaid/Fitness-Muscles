import type { Tables } from '@/types/db';
import type { TrendPoint } from '@/components/ui';
import { MS_PER_DAY, parseLocalDate, planCoords, startOfDay, weekStartSeries } from './dateWeeks';

type Assignment = Tables<'plan_assignments'>;
type CoachClient = Tables<'coach_clients'>;
type PlanDay = Tables<'plan_days'>;
type ProgressLog = Tables<'progress_logs'>;

/** Count of coach_clients rows whose status is 'active'. */
export function activeClientCount(coachClients: CoachClient[]): number {
  let count = 0;
  for (const row of coachClients) {
    if (row.status === 'active') count += 1;
  }
  return count;
}

/**
 * Last `weeks` calendar weeks (Sunday-start) ending the week containing `now`,
 * oldest first. value = count of progress_logs whose completed_at falls in that
 * week; label = week-start as "D/M".
 */
export function weeklyCompletionSeries(
  progressLogs: ProgressLog[],
  weeks = 6,
  now: Date = new Date(),
): TrendPoint[] {
  return weekStartSeries(weeks, now).map(({ weekStart, label }) => {
    const start = weekStart.getTime();
    const end = start + 7 * MS_PER_DAY;
    let value = 0;
    for (const log of progressLogs) {
      const t = new Date(log.completed_at).getTime();
      if (t >= start && t < end) value += 1;
    }
    return { label, value };
  });
}

/**
 * Mean perceived_effort over logs with a non-null perceived_effort.
 * Returns 0 when there are no such logs. Rounded to 1 decimal.
 */
export function avgEffortAcrossClients(progressLogs: ProgressLog[]): number {
  let sum = 0;
  let count = 0;
  for (const log of progressLogs) {
    if (log.perceived_effort === null) continue;
    sum += log.perceived_effort;
    count += 1;
  }
  if (count === 0) return 0;
  return Math.round((sum / count) * 10) / 10;
}

/** Most recent completed_at for the given client, or null when none exist. */
export function lastActivityAt(clientId: string, progressLogs: ProgressLog[]): string | null {
  let latest: string | null = null;
  for (const log of progressLogs) {
    if (log.client_id !== clientId) continue;
    if (latest === null || new Date(log.completed_at).getTime() > new Date(latest).getTime()) {
      latest = log.completed_at;
    }
  }
  return latest;
}

/**
 * 0–100 adherence: of the scheduled workout-days (plan_days with a workout_id)
 * that have come due since the assignment's start_date up to `now`, the
 * percentage that have a matching progress_log for this assignment.
 *
 * "Expected so far" counts each scheduled (week, day_of_week) slot once per
 * elapsed occurrence within [start_date, now]. Completion is matched on
 * assignment_id + the plan-week/day coordinates of the log's completed_at, so a
 * slot counts as done when any log lands on its scheduled calendar day.
 * Returns 0 when nothing is expected yet.
 */
export function clientAdherence(
  assignment: Assignment,
  planDays: PlanDay[],
  progressLogs: ProgressLog[],
  now: Date = new Date(),
): number {
  const scheduled = new Set<string>();
  for (const pd of planDays) {
    if (pd.plan_id === assignment.plan_id && pd.workout_id !== null) {
      scheduled.add(`${pd.week_number}:${pd.day_of_week}`);
    }
  }
  if (scheduled.size === 0) return 0;

  const start = parseLocalDate(assignment.start_date);
  if (planCoords(assignment, now) === null) return 0;

  const completedDays = new Set<number>();
  for (const log of progressLogs) {
    if (log.assignment_id !== assignment.id) continue;
    completedDays.add(startOfDay(new Date(log.completed_at)).getTime());
  }

  let expected = 0;
  let done = 0;
  const cursor = new Date(start);
  while (cursor.getTime() <= now.getTime()) {
    const coords = planCoords(assignment, cursor);
    if (coords !== null && scheduled.has(`${coords.week}:${coords.dow}`)) {
      expected += 1;
      if (completedDays.has(startOfDay(cursor).getTime())) done += 1;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  if (expected === 0) return 0;
  return Math.round((done / expected) * 100);
}
