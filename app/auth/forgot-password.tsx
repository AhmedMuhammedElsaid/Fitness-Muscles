import { View, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { PrimaryButton, TextInput } from '@/components/ui';
import { supabase } from '@/config/supabase';
import { firstError } from '@/lib/formError';
import { useState } from 'react';

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
});

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm({
    defaultValues: { email: '' },
    validators: { onChange: schema },
    onSubmit: async ({ value }) => {
      setLoading(true);
      await supabase.auth.resetPasswordForEmail(value.email);
      setSent(true);
      setLoading(false);
    },
  });

  if (sent) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-7">
        <Text className="text-primary font-serif text-2xl italic mb-4">{t('auth.checkEmailTitle')}</Text>
        <Text className="text-text-secondary text-center text-sm mb-8">
          {t('auth.checkEmailSubtitle')}
        </Text>
        <PrimaryButton title={t('auth.backToLogin')} onPress={() => router.replace('/auth/login')} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background items-center justify-center px-7"
    >
      <Text className="text-primary font-serif text-2xl italic mb-2">{t('auth.forgotTitle')}</Text>
      <Text className="text-text-secondary text-center text-sm mb-8">
        {t('auth.forgotSubtitle')}
      </Text>
      <form.Field name="email">
        {(field) => (
          <TextInput
            placeholder={t('auth.emailPlaceholder')}
            keyboardType="email-address"
            autoCapitalize="none"
            value={field.state.value}
            onChangeText={field.handleChange}
            onBlur={field.handleBlur}
            error={firstError(field.state.meta.errors)}
          />
        )}
      </form.Field>
      <View className="mt-6 w-full">
        <PrimaryButton title={t('auth.sendResetLink')} loading={loading} onPress={() => form.handleSubmit()} />
      </View>
    </KeyboardAvoidingView>
  );
}
