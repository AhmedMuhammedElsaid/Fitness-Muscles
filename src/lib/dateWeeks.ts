import type { Tables } from '@/types/db';

type Assignment = Tables<'plan_assignments'>;

export const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Sunday 00:00 local for the week containing `d`. */
export function startOfWeek(d: Date): Date {
  const local = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  local.setDate(local.getDate() - local.getDay());
  return local;
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Whole days between two dates, ignoring time-of-day. */
export function dayDiff(later: Date, earlier: Date): number {
  return Math.round((startOfDay(later).getTime() - startOfDay(earlier).getTime()) / MS_PER_DAY);
}

/**
 * Parses a SQL `date` column ("YYYY-MM-DD") as local midnight. `new Date(dateOnly)`
 * would parse it as UTC midnight, which resolves to the previous local calendar day
 * for users behind UTC. Handles the date-only shape only — not timestamps.
 */
export function parseLocalDate(dateOnly: string): Date {
  const [y, m, d] = dateOnly.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Maps a calendar date to its 1-based plan week + day_of_week for the given assignment.
 * Returns null when the date precedes start_date (no scheduled work yet).
 */
export function planCoords(assignment: Assignment, date: Date): { week: number; dow: number } | null {
  const elapsed = dayDiff(date, parseLocalDate(assignment.start_date));
  if (elapsed < 0) return null;
  return { week: Math.floor(elapsed / 7) + 1, dow: date.getDay() };
}

/**
 * Last `weeks` calendar weeks (Sunday-start) ending the week containing `now`,
 * oldest first. Each entry carries the week-start Date and its "D/M" label, for
 * callers to fold a per-week value into.
 */
export function weekStartSeries(weeks: number, now: Date): { weekStart: Date; label: string }[] {
  const currentWeekStart = startOfWeek(now);
  const series: { weekStart: Date; label: string }[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(weekStart.getDate() - i * 7);
    series.push({ weekStart, label: `${weekStart.getDate()}/${weekStart.getMonth() + 1}` });
  }
  return series;
}
