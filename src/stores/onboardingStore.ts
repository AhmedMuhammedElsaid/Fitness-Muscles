import { create } from 'zustand';

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

export const useOnboardingStore = create<OnboardingState>((set) => ({
  currentStep: 1,
  formData: {},
  setStep: (step) => set({ currentStep: step }),
  updateFormData: (data) =>
    set((state) => ({ formData: { ...state.formData, ...data } })),
  reset: () => set({ currentStep: 1, formData: {} }),
}));
