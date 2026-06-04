import { View, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useForm } from '@tanstack/react-form';
import { useTranslation } from 'react-i18next';
import { PrimaryButton, TextInput } from '@/components/ui';
import { basicInfoSchema } from '@/db/intake-schemas';
import { patchDraft, setOnboardingStep, useOnboardingStore } from '@/stores/onboardingStore';
import { firstError } from '@/lib/formError';

export default function BasicInfoStep() {
  const { t } = useTranslation();
  const saved = useOnboardingStore((s) => s.draft.basicInfo);

  setOnboardingStep(2);

  const form = useForm({
    defaultValues: {
      fullName: saved?.fullName ?? '',
      dateOfBirth: saved?.dateOfBirth ?? '',
      gender: saved?.gender ?? '',
      city: saved?.city ?? '',
      country: saved?.country ?? '',
    },
    validators: { onChange: basicInfoSchema },
    onSubmit: ({ value }) => {
      patchDraft({ basicInfo: value });
      router.push('/onboarding-form/body-metrics');
    },
  });

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-7 pb-8"
      keyboardShouldPersistTaps="handled"
    >
      <Text className="text-white font-sans text-xl font-semibold mb-1 mt-6">
        {t('onboarding.basicInfo.title')}
      </Text>
      <Text className="text-text-secondary text-sm mb-8">
        {t('onboarding.basicInfo.subtitle')}
      </Text>

      <View className="gap-4">
        <form.Field name="fullName">
          {(f) => (
            <TextInput
              label={t('onboarding.basicInfo.fullName')}
              placeholder={t('onboarding.basicInfo.fullNamePlaceholder')}
              value={f.state.value}
              onChangeText={f.handleChange}
              onBlur={f.handleBlur}
              error={firstError(f.state.meta.errors)}
            />
          )}
        </form.Field>
        <form.Field name="dateOfBirth">
          {(f) => (
            <TextInput
              label={t('onboarding.basicInfo.dateOfBirth')}
              placeholder={t('onboarding.basicInfo.dateOfBirthPlaceholder')}
              value={f.state.value}
              onChangeText={f.handleChange}
              onBlur={f.handleBlur}
              error={firstError(f.state.meta.errors)}
            />
          )}
        </form.Field>
        <form.Field name="gender">
          {(f) => (
            <TextInput
              label={t('onboarding.basicInfo.gender')}
              placeholder={t('onboarding.basicInfo.genderPlaceholder')}
              value={f.state.value}
              onChangeText={f.handleChange}
              onBlur={f.handleBlur}
              error={firstError(f.state.meta.errors)}
            />
          )}
        </form.Field>
        <form.Field name="city">
          {(f) => (
            <TextInput
              label={t('onboarding.basicInfo.city')}
              placeholder={t('onboarding.basicInfo.cityPlaceholder')}
              value={f.state.value}
              onChangeText={f.handleChange}
              onBlur={f.handleBlur}
            />
          )}
        </form.Field>
        <form.Field name="country">
          {(f) => (
            <TextInput
              label={t('onboarding.basicInfo.country')}
              placeholder={t('onboarding.basicInfo.countryPlaceholder')}
              value={f.state.value}
              onChangeText={f.handleChange}
              onBlur={f.handleBlur}
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
