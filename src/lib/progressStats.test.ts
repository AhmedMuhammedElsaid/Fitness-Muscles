import type { Tables } from '@/types/db';
import {
  avgEffort,
  currentStreak,
  planProgressPct,
  weekVolume,
  weeklyVolumeSeries,
  workoutsCompleted,
} from './progressStats';

type Assignment = Tables<'plan_assignments'>;
type PlanDay = Tables<'plan_days'>;
type ProgressLog = Tables<'progress_logs'>;
type SetLog = Tables<'set_logs'>;

const PLAN_ID = 'plan-1';
const ASSIGNMENT_ID = 'assign-1';

// 2026-06-07 is a Sunday (verified via JS Date.getDay()).
function localDate(y: number, m: number, d: number): Date {
  return new Date(y, m - 1, d);
}

function makeAssignment(startDate: string): Assignment {
  return {
    id: ASSIGNMENT_ID,
    client_id: 'client-1',
    plan_id: PLAN_ID,
    start_date: startDate,
    status: 'active',
    created_at: '2026-06-01T00:00:00.000Z',
    updated_at: '2026-06-01T00:00:00.000Z',
  };
}

function makePlanDay(week: number, dow: number, workoutId: string | null): PlanDay {
  return {
    id: `pd-${week}-${dow}`,
    plan_id: PLAN_ID,
    week_number: week,
    day_of_week: dow,
    workout_id: workoutId,
  };
}

function makeLog(id: string, completedAt: Date, effort: number | null): ProgressLog {
  return {
    id,
    assignment_id: ASSIGNMENT_ID,
    plan_day_id: 'pd-x',
    client_id: 'client-1',
    completed_at: completedAt.toISOString(),
    notes: null,
    perceived_effort: effort,
    created_at: completedAt.toISOString(),
    updated_at: completedAt.toISOString(),
  };
}

function makeSet(logId: string, reps: number | null, weight: number | null): SetLog {
  return {
    id: `set-${logId}-${reps}-${weight}`,
    progress_log_id: logId,
    exercise_id: 'ex-1',
    set_number: 1,
    reps_done: reps,
    weight_done: weight,
    created_at: '2026-06-01T00:00:00.000Z',
  };
}

describe('currentStreak', () => {
  // Plan starts Sunday 2026-06-07 (week 1, dow 0). Scheduled workouts: dow 0,2,4 (Sun/Tue/Thu).
  const assignment = makeAssignment('2026-06-07');
  const planDays: PlanDay[] = [
    makePlanDay(1, 0, 'w'),
    makePlanDay(1, 1, null),
    makePlanDay(1, 2, 'w'),
    makePlanDay(1, 3, null),
    makePlanDay(1, 4, 'w'),
  ];

  it('returns 0 for empty logs', () => {
    expect(currentStreak(assignment, planDays, [], localDate(2026, 6, 11))).toBe(0);
  });

  it('does not break across a rest day in the middle', () => {
    // now = Thu 2026-06-11. Scheduled: Sun(7), Tue(9), Thu(11). Mon/Wed are rest.
    const logs = [
      makeLog('l1', localDate(2026, 6, 7), 5),
      makeLog('l2', localDate(2026, 6, 9), 5),
      makeLog('l3', localDate(2026, 6, 11), 5),
    ];
    expect(currentStreak(assignment, planDays, logs, localDate(2026, 6, 11))).toBe(3);
  });

  it('breaks at the first missed scheduled workout', () => {
    // now = Thu 2026-06-11. Missing Tue(9) -> streak counts only Thu(11).
    const logs = [
      makeLog('l1', localDate(2026, 6, 7), 5),
      makeLog('l3', localDate(2026, 6, 11), 5),
    ];
    expect(currentStreak(assignment, planDays, logs, localDate(2026, 6, 11))).toBe(1);
  });

  it("does not count today's scheduled workout if not yet logged but still counts earlier days", () => {
    // now = Thu 2026-06-11 (scheduled, no log) -> breaks immediately, streak 0.
    const logs = [makeLog('l1', localDate(2026, 6, 9), 5)];
    expect(currentStreak(assignment, planDays, logs, localDate(2026, 6, 11))).toBe(0);
  });

  it('ignores logs from other assignments', () => {
    const foreign = { ...makeLog('lx', localDate(2026, 6, 11), 5), assignment_id: 'other' };
    expect(currentStreak(assignment, planDays, [foreign], localDate(2026, 6, 11))).toBe(0);
  });
});

describe('weekVolume', () => {
  it('returns 0 for empty inputs', () => {
    expect(weekVolume([], [], localDate(2026, 6, 7))).toBe(0);
  });

  it('sums reps*weight for logs inside the week window only', () => {
    const inWeek = makeLog('a', localDate(2026, 6, 8), 5);
    const nextWeek = makeLog('b', localDate(2026, 6, 15), 5);
    const logs = [inWeek, nextWeek];
    const sets = [
      makeSet('a', 10, 50), // 500
      makeSet('a', 8, 60), // 480
      makeSet('b', 10, 100), // excluded (next week)
    ];
    expect(weekVolume(logs, sets, localDate(2026, 6, 7))).toBe(980);
  });

  it('treats null reps/weight as 0', () => {
    const log = makeLog('a', localDate(2026, 6, 8), 5);
    const sets = [makeSet('a', null, 50), makeSet('a', 10, null)];
    expect(weekVolume([log], sets, localDate(2026, 6, 7))).toBe(0);
  });
});

describe('avgEffort', () => {
  it('returns 0 when there are no logs', () => {
    expect(avgEffort([])).toBe(0);
  });

  it('averages all logs when sinceDate omitted, rounded to 1 decimal', () => {
    const logs = [
      makeLog('a', localDate(2026, 6, 7), 5),
      makeLog('b', localDate(2026, 6, 8), 8),
      makeLog('c', localDate(2026, 6, 9), 8),
    ];
    // (5+8+8)/3 = 7.0
    expect(avgEffort(logs)).toBe(7);
  });

  it('rounds to a single decimal', () => {
    const logs = [
      makeLog('a', localDate(2026, 6, 7), 5),
      makeLog('b', localDate(2026, 6, 8), 8),
    ];
    // 6.5
    expect(avgEffort(logs)).toBe(6.5);
  });

  it('filters by sinceDate', () => {
    const logs = [
      makeLog('a', localDate(2026, 6, 1), 2),
      makeLog('b', localDate(2026, 6, 10), 8),
    ];
    expect(avgEffort(logs, localDate(2026, 6, 5))).toBe(8);
  });

  it('treats null effort as 0 in the mean', () => {
    const logs = [makeLog('a', localDate(2026, 6, 7), null), makeLog('b', localDate(2026, 6, 8), 10)];
    expect(avgEffort(logs)).toBe(5);
  });
});

describe('workoutsCompleted', () => {
  const assignment = makeAssignment('2026-06-07');

  it('returns 0 for empty logs', () => {
    expect(workoutsCompleted(assignment, [])).toBe(0);
  });

  it('counts only logs for the assignment', () => {
    const logs = [
      makeLog('a', localDate(2026, 6, 7), 5),
      makeLog('b', localDate(2026, 6, 8), 5),
      { ...makeLog('c', localDate(2026, 6, 9), 5), assignment_id: 'other' },
    ];
    expect(workoutsCompleted(assignment, logs)).toBe(2);
  });
});

describe('planProgressPct', () => {
  it('returns 0 when weekNumber is null', () => {
    expect(planProgressPct(null, 8)).toBe(0);
  });

  it('returns 0 when durationWeeks <= 0', () => {
    expect(planProgressPct(3, 0)).toBe(0);
    expect(planProgressPct(3, -4)).toBe(0);
  });

  it('computes a mid-plan percentage', () => {
    expect(planProgressPct(2, 8)).toBe(25);
  });

  it('clamps above 100', () => {
    expect(planProgressPct(12, 8)).toBe(100);
  });
});

describe('weeklyVolumeSeries', () => {
  it('returns empty array when weeks is 0', () => {
    expect(weeklyVolumeSeries([], [], 0, localDate(2026, 6, 10))).toEqual([]);
  });

  it('builds an oldest-first multi-week series with D/M labels', () => {
    // now = Wed 2026-06-10 -> current week starts Sun 2026-06-07.
    // 3 weeks: 2026-05-24, 2026-05-31, 2026-06-07.
    const logs = [
      makeLog('a', localDate(2026, 5, 25), 5), // week of 05-24
      makeLog('b', localDate(2026, 6, 8), 5), // week of 06-07
    ];
    const sets = [makeSet('a', 10, 10), makeSet('b', 10, 20)];
    const series = weeklyVolumeSeries(logs, sets, 3, localDate(2026, 6, 10));

    expect(series).toEqual([
      { label: '24/5', value: 100 },
      { label: '31/5', value: 0 },
      { label: '7/6', value: 200 },
    ]);
  });
});
