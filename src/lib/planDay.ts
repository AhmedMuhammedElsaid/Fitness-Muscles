import type { Tables } from '@/types/db';

type Assignment = Tables<'plan_assignments'>;
type PlanDay = Tables<'plan_days'>;

/**
 * Compute how many calendar days have elapsed since the assignment start date.
 * Returns negative values if today is before start_date.
 */
function daysElapsed(startDate: string): number {
  const start = new Date(startDate);
  const today = new Date();
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.floor((todayDay.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Return the plan_days row that corresponds to today, or null (rest day / out of range).
 * Callers should treat null as a rest day when week is within the plan range.
 */
export function getTodaysPlanDay(
  assignment: Assignment,
  planDays: PlanDay[],
): PlanDay | null {
  const elapsed = daysElapsed(assignment.start_date);
  if (elapsed < 0) return null;

  const weekNumber = Math.floor(elapsed / 7) + 1;
  const dayOfWeek = new Date().getDay();

  return (
    planDays.find(
      (pd) =>
        pd.plan_id === assignment.plan_id &&
        pd.week_number === weekNumber &&
        pd.day_of_week === dayOfWeek,
    ) ?? null
  );
}

/**
 * Returns whether today falls within the plan's active range.
 * Needs the plan's duration_weeks to know when the plan ends.
 */
export function isTodayInPlanRange(assignment: Assignment, durationWeeks: number): boolean {
  const elapsed = daysElapsed(assignment.start_date);
  return elapsed >= 0 && elapsed < durationWeeks * 7;
}

/**
 * Returns the plan_days rows for a given week, keyed by day_of_week (0-6).
 * Missing keys = rest day for that day.
 */
export function getWeekPlanDays(
  assignment: Assignment,
  planDays: PlanDay[],
  weekNumber: number,
): Map<number, PlanDay> {
  const result = new Map<number, PlanDay>();
  for (const pd of planDays) {
    if (pd.plan_id === assignment.plan_id && pd.week_number === weekNumber) {
      result.set(pd.day_of_week, pd);
    }
  }
  return result;
}

/**
 * Returns the 1-based week number the client is currently on.
 * Returns null if today is before the start date.
 */
export function currentWeekNumber(assignment: Assignment): number | null {
  const elapsed = daysElapsed(assignment.start_date);
  if (elapsed < 0) return null;
  return Math.floor(elapsed / 7) + 1;
}

/**
 * Returns the absolute date (as a local ISO yyyy-mm-dd string) for a given
 * week + day in an assignment.
 */
export function planDayToDate(assignment: Assignment, weekNumber: number, dayOfWeek: number): string {
  const start = new Date(assignment.start_date);
  const offset = (weekNumber - 1) * 7 + dayOfWeek - start.getDay();
  const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

/**
 * True when the given assignment + week + day is in the past relative to today.
 */
export function isPlanDayPast(assignment: Assignment, weekNumber: number, dayOfWeek: number): boolean {
  const dateStr = planDayToDate(assignment, weekNumber, dayOfWeek);
  const today = new Date();
  const todayStr = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    .toISOString()
    .slice(0, 10);
  return dateStr < todayStr;
}

/**
 * True when the given assignment + week + day is today.
 */
export function isPlanDayToday(assignment: Assignment, weekNumber: number, dayOfWeek: number): boolean {
  const dateStr = planDayToDate(assignment, weekNumber, dayOfWeek);
  const today = new Date();
  const todayStr = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    .toISOString()
    .slice(0, 10);
  return dateStr === todayStr;
}
