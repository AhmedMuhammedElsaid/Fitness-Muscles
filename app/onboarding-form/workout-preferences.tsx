import { Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { PrimaryButton, ChipSelector } from '@/components/ui';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useEffect, useState } from 'react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function WorkoutPreferencesStep() {
  const { formData, updateFormData, setStep } = useOnboardingStore();
  useEffect(() => { setStep(5); }, [setStep]);

  const [days, setDays] = useState<string[]>(formData.preferredDays || []);

  const toggleDay = (value: string) =>
    setDays((prev) => prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value]);

  const onNext = () => {
    updateFormData({ preferredDays: days });
    router.push('/onboarding-form/nutrition');
  };

  return (
    <ScrollView className="flex-1" contentContainerClassName="px-7 pb-8">
      <Text className="text-white font-sans text-xl font-semibold mb-1 mt-6">Workout Preferences</Text>
      <Text className="text-text-secondary text-sm mb-8">When do you prefer to work out?</Text>

      <Text className="text-white text-sm font-sans font-medium mb-3">Preferred Days</Text>
      <ChipSelector options={DAYS} selected={days} onToggle={toggleDay} />

      <PrimaryButton title="Continue" disabled={!days.length} onPress={onNext} className="mt-8" />
    </ScrollView>
  );
}
