import { Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { PrimaryButton, ChipSelector } from '@/components/ui';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useEffect, useState } from 'react';

const GOALS = ['Lose Weight', 'Build Muscle', 'Get Fit', 'Improve Endurance', 'Flexibility'];
const WORKOUT_TYPES = ['Gym', 'Home Workout', 'Yoga', 'HIIT', 'Running', 'Swimming', 'Cycling'];

export default function FitnessGoalsStep() {
  const { formData, updateFormData, setStep } = useOnboardingStore();
  const [goal, setGoal] = useState(formData.primaryGoal ? [formData.primaryGoal] : []);
  const [types, setTypes] = useState<string[]>(formData.workoutTypes || []);

  useEffect(() => { setStep(2); }, [setStep]);

  const toggleGoal = (value: string) => setGoal([value]);
  const toggleType = (value: string) =>
    setTypes((prev) => prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]);

  const onNext = () => {
    updateFormData({ primaryGoal: goal[0], workoutTypes: types });
    router.push('/onboarding-form/body-metrics');
  };

  return (
    <ScrollView className="flex-1" contentContainerClassName="px-7 pb-8">
      <Text className="text-white font-sans text-xl font-semibold mb-1 mt-6">Fitness Goals</Text>
      <Text className="text-text-secondary text-sm mb-8">What do you want to achieve?</Text>

      <Text className="text-white text-sm font-sans font-medium mb-3">Primary Goal</Text>
      <ChipSelector options={GOALS} selected={goal} onToggle={toggleGoal} className="mb-6" />

      <Text className="text-white text-sm font-sans font-medium mb-3">Workout Types</Text>
      <ChipSelector options={WORKOUT_TYPES} selected={types} onToggle={toggleType} />

      <PrimaryButton
        title="Continue"
        disabled={!goal.length}
        onPress={onNext}
        className="mt-8"
      />
    </ScrollView>
  );
}
