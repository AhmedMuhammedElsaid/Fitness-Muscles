import { View, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useForm } from '@tanstack/react-form';
import { useTranslation } from 'react-i18next';
import { PrimaryButton, ToggleOption, TextInput } from '@/components/ui';
import { patchDraft, setOnboardingStep, useOnboardingStore } from '@/stores/onboardingStore';
import { firstError } from '@/lib/formError';

export default function HealthRestrictionsStep() {
  const { t } = useTranslation();
  const saved = useOnboardingStore((s) => s.draft.healthRestrictions);

  setOnboardingStep(5);

  const form = useForm({
    defaultValues: {
      hasMedicalConditions: saved?.hasMedicalConditions ?? false,
      medicalConditions: saved?.medicalConditions ?? '',
      hasInjuries: saved?.hasInjuries ?? false,
      injuries: saved?.injuries ?? '',
      hasFoodAllergies: saved?.hasFoodAllergies ?? false,
      foodAllergies: saved?.foodAllergies ?? '',
    },
    onSubmit: ({ value }) => {
      patchDraft({
        healthRestrictions: {
          hasMedicalConditions: value.hasMedicalConditions,
          medicalConditions: value.medicalConditions || undefined,
          hasInjuries: value.hasInjuries,
          injuries: value.injuries || undefined,
          hasFoodAllergies: value.hasFoodAllergies,
          foodAllergies: value.foodAllergies || undefined,
        },
      });
      router.push('/onboarding-form/nutrition');
    },
  });

  return (
    <ScrollView className="flex-1" contentContainerClassName="px-7 pb-8">
      <Text className="text-white font-sans text-xl font-semibold mb-1 mt-6">
        {t('onboarding.healthRestrictions.title')}
      </Text>
      <Text className="text-text-secondary text-sm mb-8">
        {t('onboarding.healthRestrictions.subtitle')}
      </Text>

      <View className="gap-5">
        <form.Field name="hasMedicalConditions">
          {(f) => (
            <View>
              <ToggleOption
                label={t('onboarding.healthRestrictions.medicalConditions')}
                value={f.state.value}
                onToggle={f.handleChange}
              />
              {f.state.value ? (
                <form.Field name="medicalConditions">
                  {(details) => (
                    <TextInput
                      label={t('onboarding.healthRestrictions.medicalDetails')}
                      value={details.state.value}
                      onChangeText={details.handleChange}
                      onBlur={details.handleBlur}
                      className="mt-3"
                      error={firstError(details.state.meta.errors)}
                    />
                  )}
                </form.Field>
              ) : null}
            </View>
          )}
        </form.Field>

        <form.Field name="hasInjuries">
          {(f) => (
            <View>
              <ToggleOption
                label={t('onboarding.healthRestrictions.injuries')}
                value={f.state.value}
                onToggle={f.handleChange}
              />
              {f.state.value ? (
                <form.Field name="injuries">
                  {(details) => (
                    <TextInput
                      label={t('onboarding.healthRestrictions.injuryDetails')}
                      value={details.state.value}
                      onChangeText={details.handleChange}
                      onBlur={details.handleBlur}
                      className="mt-3"
                      error={firstError(details.state.meta.errors)}
                    />
                  )}
                </form.Field>
              ) : null}
            </View>
          )}
        </form.Field>

        <form.Field name="hasFoodAllergies">
          {(f) => (
            <View>
              <ToggleOption
                label={t('onboarding.healthRestrictions.foodAllergies')}
                value={f.state.value}
                onToggle={f.handleChange}
              />
              {f.state.value ? (
                <form.Field name="foodAllergies">
                  {(details) => (
                    <TextInput
                      label={t('onboarding.healthRestrictions.allergyDetails')}
                      value={details.state.value}
                      onChangeText={details.handleChange}
                      onBlur={details.handleBlur}
                      className="mt-3"
                      error={firstError(details.state.meta.errors)}
                    />
                  )}
                </form.Field>
              ) : null}
            </View>
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
