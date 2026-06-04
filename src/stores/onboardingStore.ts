import { Store, useStore } from '@tanstack/react-store';

interface OnboardingFormData {
  role?: 'client' | 'coach';
  fullName?: string;
  dateOfBirth?: string;
  gender?: string;
  city?: string;
  country?: string;
  primaryGoal?: string;
  workoutTypes?: string[];
  currentWeight?: number;
  targetWeight?: number;
  heightFt?: number;
  heightIn?: number;
  activityLevel?: string;
  hasMedicalConditions?: boolean;
  medicalConditions?: string;
  hasInjuries?: boolean;
  injuries?: string;
  hasFoodAllergies?: boolean;
  foodAllergies?: string;
  preferredDays?: string[];
  preferredTimeFrom?: string;
  preferredTimeTo?: string;
  dietaryPreference?: string;
  hasTrainer?: boolean;
  trainerCode?: string;
}

interface OnboardingState {
  currentStep: number;
  formData: OnboardingFormData;
  setStep: (step: number) => void;
  updateFormData: (data: Partial<OnboardingFormData>) => void;
  reset: () => void;
}

export const onboardingStore = new Store<OnboardingState>({
  currentStep: 1,
  formData: {},
  setStep: (step) => onboardingStore.setState((s) => ({ ...s, currentStep: step })),
  updateFormData: (data) =>
    onboardingStore.setState((s) => ({ ...s, formData: { ...s.formData, ...data } })),
  reset: () => onboardingStore.setState((s) => ({ ...s, currentStep: 1, formData: {} })),
});

export function useOnboardingStore(): OnboardingState;
export function useOnboardingStore<T>(selector: (state: OnboardingState) => T): T;
export function useOnboardingStore<T>(selector?: (state: OnboardingState) => T) {
  return useStore(onboardingStore, selector as ((state: OnboardingState) => T) | undefined);
}

export type { OnboardingFormData };
