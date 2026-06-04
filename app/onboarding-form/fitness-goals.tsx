import { Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { PrimaryButton, ChipSelector } from '@/components/ui';
import { patchDraft, setOnboardingStep, useOnboardingStore } from '@/stores/onboardingStore';

const GOALS = ['Lose Weight', 'Build Muscle', 'Get Fit', 'Improve Endurance', 'Flexibility'];
const WORKOUT_TYPES = ['Gym', 'Home Workout', 'Yoga', 'HIIT', 'Running', 'Swimming', 'Cycling'];

export default function FitnessGoalsStep() {
  const { t } = useTranslation();
  const saved = useOnboardingStore((s) => s.draft.fitnessGoals);

  setOnboardingStep(4);

  const [goal, setGoal] = useState<string[]>(
    saved?.primaryGoal ? [saved.primaryGoal] : [],
  );
  const [types, setTypes] = useState<string[]>(saved?.workoutTypes ?? []);

  const onNext = () => {
    patchDraft({ fitnessGoals: { primaryGoal: goal[0], workoutTypes: types } });
    router.push('/onboarding-form/health-restrictions');
  };

  return (
    <ScrollView className="flex-1" contentContainerClassName="px-7 pb-8">
      <Text className="text-white font-sans text-xl font-semibold mb-1 mt-6">
        {t('onboarding.fitnessGoals.title')}
      </Text>
      <Text className="text-text-secondary text-sm mb-8">
        {t('onboarding.fitnessGoals.subtitle')}
      </Text>

      <Text className="text-white text-sm font-sans font-medium mb-3">
        {t('onboarding.fitnessGoals.primaryGoal')}
      </Text>
      <ChipSelector
        options={GOALS}
        selected={goal}
        onToggle={(v) => setGoal([v])}
        className="mb-6"
      />

      <Text className="text-white text-sm font-sans font-medium mb-3">
        {t('onboarding.fitnessGoals.workoutTypes')}
      </Text>
      <ChipSelector
        options={WORKOUT_TYPES}
        selected={types}
        onToggle={(v) =>
          setTypes((prev) =>
            prev.includes(v) ? prev.filter((t) => t !== v) : [...prev, v],
          )
        }
      />

      <PrimaryButton
        title={t('onboarding.continue')}
        disabled={!goal.length || !types.length}
        onPress={onNext}
        className="mt-8"
      />
    </ScrollView>
  );
}
