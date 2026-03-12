import { View, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PrimaryButton, TextInput } from '@/components/ui';
import { supabase } from '@/config/supabase';
import { useState } from 'react';

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
});

type ForgotForm = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<ForgotForm>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: ForgotForm) => {
    setLoading(true);
    await supabase.auth.resetPasswordForEmail(data.email);
    setSent(true);
    setLoading(false);
  };

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
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            placeholder="your@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.email?.message}
          />
        )}
      />
      <View className="mt-6 w-full">
        <PrimaryButton title="Send Reset Link" loading={loading} onPress={handleSubmit(onSubmit)} />
      </View>
    </KeyboardAvoidingView>
  );
}
