import { Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { PrimaryButton, ChipSelector } from '@/components/ui';
import { patchDraft, setOnboardingStep, useOnboardingStore } from '@/stores/onboardingStore';

const DIETS = ['No Preference', 'Vegetarian', 'Vegan', 'Keto', 'Paleo', 'Mediterranean'];

export default function NutritionStep() {
  const { t } = useTranslation();
  const saved = useOnboardingStore((s) => s.draft.nutritionPrefs);

  setOnboardingStep(6);

  const [diet, setDiet] = useState<string[]>(
    saved?.dietaryPreference ? [saved.dietaryPreference] : [],
  );

  const onNext = () => {
    patchDraft({ nutritionPrefs: { dietaryPreference: diet[0] } });
    router.push('/onboarding-form/workout-preferences');
  };

  return (
    <ScrollView className="flex-1" contentContainerClassName="px-7 pb-8">
      <Text className="text-white font-sans text-xl font-semibold mb-1 mt-6">
        {t('onboarding.nutrition.title')}
      </Text>
      <Text className="text-text-secondary text-sm mb-8">
        {t('onboarding.nutrition.subtitle')}
      </Text>

      <Text className="text-white text-sm font-sans font-medium mb-3">
        {t('onboarding.nutrition.dietaryPreference')}
      </Text>
      <ChipSelector
        options={DIETS}
        selected={diet}
        onToggle={(v) => setDiet([v])}
      />

      <PrimaryButton
        title={t('onboarding.continue')}
        onPress={onNext}
        className="mt-8"
      />
    </ScrollView>
  );
}
