import type { Tables } from '@/types/db';
import { MS_PER_DAY, planCoords, startOfDay, weekStartSeries } from './dateWeeks';

type Assignment = Tables<'plan_assignments'>;
type PlanDay = Tables<'plan_days'>;
type ProgressLog = Tables<'progress_logs'>;
type SetLog = Tables<'set_logs'>;

export interface WeeklyVolumePoint {
  label: string;
  value: number;
}

/**
 * Consecutive days, counting back from `now`, where each SCHEDULED workout day
 * (a plan_days row with a workout_id for that week+dow) has a matching progress_logs
 * entry. Rest days (no scheduled workout) do not break the streak; they are skipped.
 * Stops at the first scheduled workout day with no log.
 */
export function currentStreak(
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

  const loggedDays = new Set<number>();
  for (const log of progressLogs) {
    if (log.assignment_id !== assignment.id) continue;
    loggedDays.add(startOfDay(new Date(log.completed_at)).getTime());
  }

  let streak = 0;
  const cursor = startOfDay(now);
  for (;;) {
    const coords = planCoords(assignment, cursor);
    if (coords === null) break;

    const isScheduled = scheduled.has(`${coords.week}:${coords.dow}`);
    if (isScheduled) {
      if (!loggedDays.has(cursor.getTime())) break;
      streak += 1;
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function logsById(progressLogs: ProgressLog[]): Map<string, ProgressLog> {
  const map = new Map<string, ProgressLog>();
  for (const log of progressLogs) map.set(log.id, log);
  return map;
}

/**
 * Sum of (reps_done ?? 0) * (weight_done ?? 0) over all set_logs whose parent
 * progress_log.completed_at falls in [weekStart, weekStart + 7 days).
 */
export function weekVolume(progressLogs: ProgressLog[], setLogs: SetLog[], weekStart: Date): number {
  const byId = logsById(progressLogs);
  const start = weekStart.getTime();
  const end = start + 7 * MS_PER_DAY;

  let total = 0;
  for (const set of setLogs) {
    const log = byId.get(set.progress_log_id);
    if (!log) continue;
    const t = new Date(log.completed_at).getTime();
    if (t < start || t >= end) continue;
    total += (set.reps_done ?? 0) * (set.weight_done ?? 0);
  }
  return total;
}

/**
 * Mean perceived_effort over logs with completed_at >= sinceDate (or all logs if
 * sinceDate omitted). Returns 0 when there are no logs. Rounded to 1 decimal.
 */
export function avgEffort(progressLogs: ProgressLog[], sinceDate?: Date): number {
  const since = sinceDate?.getTime();
  let sum = 0;
  let count = 0;
  for (const log of progressLogs) {
    if (since !== undefined && new Date(log.completed_at).getTime() < since) continue;
    sum += log.perceived_effort ?? 0;
    count += 1;
  }
  if (count === 0) return 0;
  return Math.round((sum / count) * 10) / 10;
}

/** Count of progress_logs for this assignment (assignment_id match). */
export function workoutsCompleted(assignment: Assignment, progressLogs: ProgressLog[]): number {
  let count = 0;
  for (const log of progressLogs) {
    if (log.assignment_id === assignment.id) count += 1;
  }
  return count;
}

/**
 * (weekNumber / durationWeeks) * 100, clamped 0..100.
 * Returns 0 when weekNumber is null or durationWeeks <= 0.
 */
export function planProgressPct(weekNumber: number | null, durationWeeks: number): number {
  if (weekNumber === null || durationWeeks <= 0) return 0;
  const pct = (weekNumber / durationWeeks) * 100;
  return Math.min(100, Math.max(0, pct));
}

/**
 * Last `weeks` calendar weeks (Sunday-start) ending the week containing `now`,
 * oldest first. value = weekVolume for that week; label = week-start as "D/M".
 */
export function weeklyVolumeSeries(
  progressLogs: ProgressLog[],
  setLogs: SetLog[],
  weeks: number,
  now: Date = new Date(),
): WeeklyVolumePoint[] {
  return weekStartSeries(weeks, now).map(({ weekStart, label }) => ({
    label,
    value: weekVolume(progressLogs, setLogs, weekStart),
  }));
}
