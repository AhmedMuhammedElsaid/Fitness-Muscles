import { View, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useForm } from '@tanstack/react-form';
import { useTranslation } from 'react-i18next';
import { PrimaryButton, TextInput } from '@/components/ui';
import { patchDraft, setOnboardingStep, useOnboardingStore } from '@/stores/onboardingStore';
import { firstError } from '@/lib/formError';

export default function BodyMetricsStep() {
  const { t } = useTranslation();
  const saved = useOnboardingStore((s) => s.draft.bodyMetrics);

  setOnboardingStep(3);

  const form = useForm({
    defaultValues: {
      heightCm: saved?.heightCm?.toString() ?? '',
      weightKg: saved?.weightKg?.toString() ?? '',
      targetWeightKg: saved?.targetWeightKg?.toString() ?? '',
    },
    onSubmit: ({ value }) => {
      patchDraft({
        bodyMetrics: {
          heightCm: value.heightCm ? parseFloat(value.heightCm) : undefined,
          weightKg: value.weightKg ? parseFloat(value.weightKg) : undefined,
          targetWeightKg: value.targetWeightKg ? parseFloat(value.targetWeightKg) : undefined,
        },
      });
      router.push('/onboarding-form/fitness-goals');
    },
  });

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-7 pb-8"
      keyboardShouldPersistTaps="handled"
    >
      <Text className="text-white font-sans text-xl font-semibold mb-1 mt-6">
        {t('onboarding.bodyMetrics.title')}
      </Text>
      <Text className="text-text-secondary text-sm mb-8">
        {t('onboarding.bodyMetrics.subtitle')}
      </Text>

      <View className="gap-4">
        <form.Field name="heightCm">
          {(f) => (
            <TextInput
              label={t('onboarding.bodyMetrics.heightCm')}
              placeholder="175"
              keyboardType="decimal-pad"
              value={f.state.value}
              onChangeText={f.handleChange}
              onBlur={f.handleBlur}
              error={firstError(f.state.meta.errors)}
            />
          )}
        </form.Field>
        <form.Field name="weightKg">
          {(f) => (
            <TextInput
              label={t('onboarding.bodyMetrics.weightKg')}
              placeholder="75"
              keyboardType="decimal-pad"
              value={f.state.value}
              onChangeText={f.handleChange}
              onBlur={f.handleBlur}
              error={firstError(f.state.meta.errors)}
            />
          )}
        </form.Field>
        <form.Field name="targetWeightKg">
          {(f) => (
            <TextInput
              label={t('onboarding.bodyMetrics.targetWeightKg')}
              placeholder="70"
              keyboardType="decimal-pad"
              value={f.state.value}
              onChangeText={f.handleChange}
              onBlur={f.handleBlur}
              error={firstError(f.state.meta.errors)}
            />
          )}
        </form.Field>
      </View>

      <PrimaryButton
        title={t('onboarding.continue')}
        onPress={() => form.handleSubmit()}
        className="mt-8"
      />
    </ScrollView>
  );
}
