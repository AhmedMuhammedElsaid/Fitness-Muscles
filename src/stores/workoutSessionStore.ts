import { Store, useStore } from '@tanstack/react-store';

export interface SetLog {
  setNumber: number;
  repsDone: number | null;
  weightDone: number | null;
}

interface WorkoutState {
  /** The planDayId of the workout currently in progress, or null if none. */
  activePlanDayId: string | null;
  assignmentId: string | null;
  startedAt: string | null;
  /** Logged sets keyed by exercise_id, then set_number (1-based). */
  sets: Record<string, SetLog[]>;
}

const initial: WorkoutState = {
  activePlanDayId: null,
  assignmentId: null,
  startedAt: null,
  sets: {},
};

export const workoutStore = new Store<WorkoutState>(initial);

export function startWorkout(planDayId: string, assignmentId: string): void {
  workoutStore.setState(() => ({
    activePlanDayId: planDayId,
    assignmentId,
    startedAt: new Date().toISOString(),
    sets: {},
  }));
}

export function upsertSet(exerciseId: string, entry: SetLog): void {
  workoutStore.setState((s) => {
    const prev = s.sets[exerciseId] ?? [];
    const idx = prev.findIndex((e) => e.setNumber === entry.setNumber);
    const next = idx >= 0
      ? prev.map((e, i) => (i === idx ? entry : e))
      : [...prev, entry];
    return { ...s, sets: { ...s.sets, [exerciseId]: next } };
  });
}

export function addSet(exerciseId: string): void {
  workoutStore.setState((s) => {
    const prev = s.sets[exerciseId] ?? [];
    const nextNum = prev.length > 0 ? Math.max(...prev.map((e) => e.setNumber)) + 1 : 1;
    return {
      ...s,
      sets: {
        ...s.sets,
        [exerciseId]: [...prev, { setNumber: nextNum, repsDone: null, weightDone: null }],
      },
    };
  });
}

export function clearWorkout(): void {
  workoutStore.setState(() => initial);
}

export function useWorkoutStore(): WorkoutState;
export function useWorkoutStore<T>(selector: (s: WorkoutState) => T): T;
export function useWorkoutStore<T>(selector?: (s: WorkoutState) => T) {
  return useStore(workoutStore, selector as ((s: WorkoutState) => T) | undefined);
}
