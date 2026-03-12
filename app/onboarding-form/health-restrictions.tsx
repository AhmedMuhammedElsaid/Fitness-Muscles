import { Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { PrimaryButton, ToggleOption } from '@/components/ui';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useEffect, useState } from 'react';

export default function HealthRestrictionsStep() {
  const { formData, updateFormData, setStep } = useOnboardingStore();
  useEffect(() => { setStep(4); }, [setStep]);

  const [hasMedical, setHasMedical] = useState(formData.hasMedicalConditions ?? false);
  const [hasInjuries, setHasInjuries] = useState(formData.hasInjuries ?? false);
  const [hasAllergies, setHasAllergies] = useState(formData.hasFoodAllergies ?? false);

  const onNext = () => {
    updateFormData({
      hasMedicalConditions: hasMedical,
      hasInjuries,
      hasFoodAllergies: hasAllergies,
    });
    router.push('/onboarding-form/workout-preferences');
  };

  return (
    <ScrollView className="flex-1" contentContainerClassName="px-7 pb-8">
      <Text className="text-white font-sans text-xl font-semibold mb-1 mt-6">Health & Restrictions</Text>
      <Text className="text-text-secondary text-sm mb-8">Any health considerations?</Text>

      <ToggleOption label="Medical conditions?" value={hasMedical} onToggle={setHasMedical} className="mb-6" />
      <ToggleOption label="Injuries?" value={hasInjuries} onToggle={setHasInjuries} className="mb-6" />
      <ToggleOption label="Food allergies?" value={hasAllergies} onToggle={setHasAllergies} className="mb-6" />

      <PrimaryButton title="Continue" onPress={onNext} className="mt-4" />
    </ScrollView>
  );
}
