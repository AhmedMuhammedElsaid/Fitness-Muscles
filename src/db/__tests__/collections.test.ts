import { __reset, __setSelect, __setWriteError } from '@/config/__mocks__/supabase';
import {
  exercisesCollection,
  plansCollection,
  tipsCollection,
  workoutsCollection,
} from '@/db/collections';

jest.mock('@/config/supabase');

const ts = '2026-06-04T00:00:00.000Z';

function exercise(id: string) {
  return {
    id,
    coach_id: 'coach-1',
    name: `Exercise ${id}`,
    description: null,
    video_url: null,
    muscle_group: null,
    equipment: null,
    created_at: ts,
    updated_at: ts,
  };
}

beforeEach(() => {
  __reset();
});

describe('collections', () => {
  it('every reactive table has a keyed collection', () => {
    expect(exercisesCollection.id).toBe('exercises');
    expect(workoutsCollection.id).toBe('workouts');
    expect(plansCollection.id).toBe('plans');
    expect(tipsCollection.id).toBe('tips');
  });

  it('fetches rows from supabase into collection state', async () => {
    __setSelect([exercise('a'), exercise('b')]);
    await exercisesCollection.preload();
    expect(exercisesCollection.state.has('a')).toBe(true);
    expect(exercisesCollection.state.get('b')?.name).toBe('Exercise b');
  });

  it('optimistically inserts and persists on success', async () => {
    const tx = exercisesCollection.insert(exercise('insert-ok'));
    expect(exercisesCollection.state.has('insert-ok')).toBe(true);
    await expect(tx.isPersisted.promise).resolves.toBeDefined();
  });

  it('rolls back the optimistic insert when supabase errors', async () => {
    __setWriteError({ message: 'insert failed', code: '23505' });
    const tx = exercisesCollection.insert(exercise('insert-fail'));
    expect(exercisesCollection.state.has('insert-fail')).toBe(true);
    await expect(tx.isPersisted.promise).rejects.toBeDefined();
    expect(exercisesCollection.state.has('insert-fail')).toBe(false);
  });
});

afterAll(async () => {
  await exercisesCollection.cleanup();
});
