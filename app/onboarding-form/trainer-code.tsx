import { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { PrimaryButton, TextInput } from '@/components/ui';
import { redeemInvite } from '@/db/mutations';
import { patchDraft, setOnboardingStep } from '@/stores/onboardingStore';
import { firstError } from '@/lib/formError';

const schema = z.object({
  code: z.string().min(1, 'Code is required'),
});

export default function TrainerCodeStep() {
  const { t } = useTranslation();
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  setOnboardingStep(1);

  const form = useForm({
    defaultValues: { code: '' },
    validators: { onChange: schema },
    onSubmit: async ({ value }) => {
      setApiError(null);
      setLoading(true);
      try {
        await redeemInvite(value.code.trim().toUpperCase());
        patchDraft({ trainerCodeRedeemed: true });
        router.push('/onboarding-form/basic-info');
      } catch (err: unknown) {
        const pgCode = (err as { code?: string })?.code;
        if (pgCode === '23505') {
          setApiError(t('onboarding.trainerCode.alreadyUsed'));
        } else if (pgCode === '22023') {
          setApiError(t('onboarding.trainerCode.invalidCode'));
        } else {
          setApiError(t('onboarding.trainerCode.unknownError'));
        }
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-7 pb-8"
      keyboardShouldPersistTaps="handled"
    >
      <Text className="text-white font-sans text-xl font-semibold mb-1 mt-6">
        {t('onboarding.trainerCode.title')}
      </Text>
      <Text className="text-text-secondary text-sm mb-8">
        {t('onboarding.trainerCode.subtitle')}
      </Text>

      <form.Field name="code">
        {(field) => (
          <TextInput
            label={t('onboarding.trainerCode.label')}
            placeholder={t('onboarding.trainerCode.placeholder')}
            value={field.state.value}
            onChangeText={(v) => {
              setApiError(null);
              field.handleChange(v);
            }}
            onBlur={field.handleBlur}
            autoCapitalize="characters"
            autoCorrect={false}
            error={firstError(field.state.meta.errors)}
          />
        )}
      </form.Field>

      {apiError ? (
        <Text className="text-red-400 font-sans text-sm mt-2">{apiError}</Text>
      ) : null}

      <View className="mt-8">
        <PrimaryButton
          title={loading ? t('common.loading') : t('onboarding.trainerCode.submit')}
          loading={loading}
          onPress={() => form.handleSubmit()}
        />
      </View>
    </ScrollView>
  );
}
