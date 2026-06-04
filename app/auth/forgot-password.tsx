import { View, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { PrimaryButton, TextInput } from '@/components/ui';
import { supabase } from '@/config/supabase';
import { firstError } from '@/lib/formError';
import { useState } from 'react';

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
});

export default function ForgotPasswordScreen() {
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
        <Text className="text-primary font-serif text-2xl italic mb-4">Check your email</Text>
        <Text className="text-text-secondary text-center text-sm mb-8">
          We sent a password reset link to your email address.
        </Text>
        <PrimaryButton title="Back to Login" onPress={() => router.replace('/auth/login')} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background items-center justify-center px-7"
    >
      <Text className="text-primary font-serif text-2xl italic mb-2">Forgot Password</Text>
      <Text className="text-text-secondary text-center text-sm mb-8">
        Enter your email and we'll send you a reset link.
      </Text>
      <form.Field name="email">
        {(field) => (
          <TextInput
            placeholder="your@email.com"
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
        <PrimaryButton title="Send Reset Link" loading={loading} onPress={() => form.handleSubmit()} />
      </View>
    </KeyboardAvoidingView>
  );
}
