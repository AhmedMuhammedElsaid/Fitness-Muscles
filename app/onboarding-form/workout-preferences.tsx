import { Text, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { PrimaryButton, ChipSelector } from '@/components/ui';
import { patchDraft, setOnboardingStep, useOnboardingStore } from '@/stores/onboardingStore';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIMES = ['Morning', 'Afternoon', 'Evening'];

export default function WorkoutPreferencesStep() {
  const { t } = useTranslation();
  const saved = useOnboardingStore((s) => s.draft.workoutPrefs);

  setOnboardingStep(7);

  const [days, setDays] = useState<string[]>(saved?.preferredDays ?? []);
  const [time, setTime] = useState<string[]>(
    saved?.preferredTimeOfDay ? [saved.preferredTimeOfDay] : [],
  );

  const onNext = () => {
    patchDraft({ workoutPrefs: { preferredDays: days, preferredTimeOfDay: time[0] } });
    router.push('/onboarding-form/request-sent');
  };

  return (
    <ScrollView className="flex-1" contentContainerClassName="px-7 pb-8">
      <Text className="text-white font-sans text-xl font-semibold mb-1 mt-6">
        {t('onboarding.workoutPrefs.title')}
      </Text>
      <Text className="text-text-secondary text-sm mb-8">
        {t('onboarding.workoutPrefs.subtitle')}
      </Text>

      <Text className="text-white text-sm font-sans font-medium mb-3">
        {t('onboarding.workoutPrefs.preferredDays')}
      </Text>
      <ChipSelector
        options={DAYS}
        selected={days}
        onToggle={(v) =>
          setDays((prev) =>
            prev.includes(v) ? prev.filter((d) => d !== v) : [...prev, v],
          )
        }
        className="mb-6"
      />

      <Text className="text-white text-sm font-sans font-medium mb-3">
        {t('onboarding.nutrition.timeOfDay')}
      </Text>
      <View className="mb-2">
        <ChipSelector
          options={TIMES}
          selected={time}
          onToggle={(v) => setTime([v])}
        />
      </View>

      <PrimaryButton
        title={t('onboarding.continue')}
        disabled={!days.length}
        onPress={onNext}
        className="mt-8"
      />
    </ScrollView>
  );
}
