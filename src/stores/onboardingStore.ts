import { Store, useStore } from '@tanstack/react-store';
import * as SecureStore from 'expo-secure-store';
import type {
  BasicInfoData,
  BodyMetricsData,
  FitnessGoalsData,
  HealthRestrictionsData,
  NutritionData,
  WorkoutPrefsData,
} from '@/db/intake-schemas';

const STORAGE_KEY = 'onboarding_draft';

export interface OnboardingDraft {
  trainerCodeRedeemed: boolean;
  basicInfo?: BasicInfoData;
  bodyMetrics?: BodyMetricsData;
  fitnessGoals?: FitnessGoalsData;
  healthRestrictions?: HealthRestrictionsData;
  nutritionPrefs?: NutritionData;
  workoutPrefs?: WorkoutPrefsData;
}

interface OnboardingState {
  currentStep: number;
  draft: OnboardingDraft;
}

const EMPTY_DRAFT: OnboardingDraft = { trainerCodeRedeemed: false };

export const onboardingStore = new Store<OnboardingState>({
  currentStep: 1,
  draft: EMPTY_DRAFT,
});

/** Load persisted draft from SecureStore (call once on app/layout mount). */
export async function hydrateOnboardingStore(): Promise<void> {
  try {
    const raw = await SecureStore.getItemAsync(STORAGE_KEY);
    if (raw) {
      const draft = JSON.parse(raw) as OnboardingDraft;
      onboardingStore.setState((s) => ({ ...s, draft }));
    }
  } catch {
    // Corrupt data — start fresh
  }
}

async function persistDraft(draft: OnboardingDraft): Promise<void> {
  try {
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Non-fatal: in-memory draft still works
  }
}

export function setOnboardingStep(step: number): void {
  onboardingStore.setState((s) => ({ ...s, currentStep: step }));
}

export function patchDraft(patch: Partial<OnboardingDraft>): void {
  onboardingStore.setState((s) => {
    const next = { ...s.draft, ...patch };
    void persistDraft(next);
    return { ...s, draft: next };
  });
}

export async function clearOnboardingDraft(): Promise<void> {
  onboardingStore.setState((s) => ({ ...s, currentStep: 1, draft: EMPTY_DRAFT }));
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function useOnboardingStore(): OnboardingState;
export function useOnboardingStore<T>(selector: (state: OnboardingState) => T): T;
export function useOnboardingStore<T>(selector?: (state: OnboardingState) => T) {
  return useStore(onboardingStore, selector as ((state: OnboardingState) => T) | undefined);
}

