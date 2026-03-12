import { Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { PrimaryButton, ChipSelector } from '@/components/ui';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useEffect, useState } from 'react';

const DIETS = ['No Preference', 'Vegetarian', 'Vegan', 'Keto', 'Paleo', 'Mediterranean'];

export default function NutritionStep() {
  const { formData, updateFormData, setStep } = useOnboardingStore();
  useEffect(() => { setStep(6); }, [setStep]);

  const [diet, setDiet] = useState(formData.dietaryPreference ? [formData.dietaryPreference] : []);

  const onNext = () => {
    updateFormData({ dietaryPreference: diet[0] });
    router.push('/onboarding-form/trainer-code');
  };

  return (
    <ScrollView className="flex-1" contentContainerClassName="px-7 pb-8">
      <Text className="text-white font-sans text-xl font-semibold mb-1 mt-6">Nutrition</Text>
      <Text className="text-text-secondary text-sm mb-8">Do you follow a specific diet?</Text>

      <ChipSelector options={DIETS} selected={diet} onToggle={(v) => setDiet([v])} />

      <PrimaryButton title="Continue" onPress={onNext} className="mt-8" />
    </ScrollView>
  );
}
