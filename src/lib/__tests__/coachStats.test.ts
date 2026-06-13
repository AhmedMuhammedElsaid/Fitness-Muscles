import {
  activeClientCount,
  weeklyCompletionSeries,
  avgEffortAcrossClients,
  lastActivityAt,
  clientAdherence,
} from '@/lib/coachStats';
import type { Tables } from '@/types/db';

type CoachClient = Tables<'coach_clients'>;
type Assignment = Tables<'plan_assignments'>;
type PlanDay = Tables<'plan_days'>;
type ProgressLog = Tables<'progress_logs'>;

function coachClient(status: string): CoachClient {
  return {
    accepted_at: '2026-01-01T00:00:00Z',
    client_id: 'c',
    coach_id: 'coach',
    created_at: '2026-01-01T00:00:00Z',
    status,
    updated_at: '2026-01-01T00:00:00Z',
  };
}

function log(overrides: Partial<ProgressLog>): ProgressLog {
  return {
    assignment_id: 'a1',
    client_id: 'client1',
    completed_at: '2026-06-13T12:00:00Z',
    created_at: '2026-06-13T12:00:00Z',
    id: Math.random().toString(36),
    notes: null,
    perceived_effort: null,
    plan_day_id: 'pd',
    updated_at: '2026-06-13T12:00:00Z',
    ...overrides,
  };
}

function planDay(overrides: Partial<PlanDay>): PlanDay {
  return {
    day_of_week: 0,
    id: Math.random().toString(36),
    plan_id: 'plan1',
    week_number: 1,
    workout_id: 'w1',
    ...overrides,
  };
}

const assignment: Assignment = {
  client_id: 'client1',
  created_at: '2026-06-01T00:00:00Z',
  id: 'a1',
  plan_id: 'plan1',
  start_date: '2026-06-01',
  status: 'active',
  updated_at: '2026-06-01T00:00:00Z',
};

describe('activeClientCount', () => {
  it('counts only active rows', () => {
    expect(
      activeClientCount([coachClient('active'), coachClient('paused'), coachClient('active')]),
    ).toBe(2);
  });

  it('returns 0 for an empty roster', () => {
    expect(activeClientCount([])).toBe(0);
  });
});

describe('weeklyCompletionSeries', () => {
  const now = new Date(2026, 5, 13); // Sat 13 Jun 2026

  it('returns one point per week, oldest first', () => {
    const series = weeklyCompletionSeries([], 6, now);
    expect(series).toHaveLength(6);
    expect(series[series.length - 1].label).toBe('7/6'); // week-start Sun 7 Jun
  });

  it('buckets completions into the right week', () => {
    const logs = [
      log({ completed_at: '2026-06-10T12:00:00Z' }), // current week
      log({ completed_at: '2026-06-11T12:00:00Z' }), // current week
      log({ completed_at: '2026-06-02T12:00:00Z' }), // prior week
    ];
    const series = weeklyCompletionSeries(logs, 6, now);
    expect(series[series.length - 1].value).toBe(2);
    expect(series[series.length - 2].value).toBe(1);
  });

  it('defaults to 6 weeks', () => {
    expect(weeklyCompletionSeries([])).toHaveLength(6);
  });
});

describe('avgEffortAcrossClients', () => {
  it('averages non-null effort rounded to 1 decimal', () => {
    const logs = [
      log({ perceived_effort: 8 }),
      log({ perceived_effort: 5 }),
      log({ perceived_effort: null }),
    ];
    expect(avgEffortAcrossClients(logs)).toBe(6.5);
  });

  it('returns 0 when no effort recorded', () => {
    expect(avgEffortAcrossClients([log({ perceived_effort: null })])).toBe(0);
    expect(avgEffortAcrossClients([])).toBe(0);
  });
});

describe('lastActivityAt', () => {
  it('returns the most recent completed_at for the client', () => {
    const logs = [
      log({ client_id: 'client1', completed_at: '2026-06-01T12:00:00Z' }),
      log({ client_id: 'client1', completed_at: '2026-06-10T12:00:00Z' }),
      log({ client_id: 'other', completed_at: '2026-06-12T12:00:00Z' }),
    ];
    expect(lastActivityAt('client1', logs)).toBe('2026-06-10T12:00:00Z');
  });

  it('returns null when the client has no logs', () => {
    expect(lastActivityAt('client1', [])).toBeNull();
    expect(lastActivityAt('client1', [log({ client_id: 'other' })])).toBeNull();
  });
});

describe('clientAdherence', () => {
  // start_date 2026-06-01 is a Monday (day_of_week 1).
  const now = new Date(2026, 5, 14); // Sun 14 Jun 2026 — covers week 1 (Mon) + week 2 (Mon).
  const planDays = [planDay({ week_number: 1, day_of_week: 1 }), planDay({ week_number: 2, day_of_week: 1 })];

  it('returns 100 when every expected workout is completed', () => {
    const logs = [
      log({ assignment_id: 'a1', completed_at: '2026-06-01T12:00:00Z' }), // wk1 Mon
      log({ assignment_id: 'a1', completed_at: '2026-06-08T12:00:00Z' }), // wk2 Mon
    ];
    expect(clientAdherence(assignment, planDays, logs, now)).toBe(100);
  });

  it('returns 50 when half are completed', () => {
    const logs = [log({ assignment_id: 'a1', completed_at: '2026-06-01T12:00:00Z' })];
    expect(clientAdherence(assignment, planDays, logs, now)).toBe(50);
  });

  it('ignores logs from other assignments', () => {
    const logs = [log({ assignment_id: 'other', completed_at: '2026-06-01T12:00:00Z' })];
    expect(clientAdherence(assignment, planDays, logs, now)).toBe(0);
  });

  it('returns 0 when nothing is scheduled or nothing is due yet', () => {
    expect(clientAdherence(assignment, [], [], now)).toBe(0);
    const before = new Date(2026, 4, 1); // before start_date
    expect(clientAdherence(assignment, planDays, [], before)).toBe(0);
  });
});
