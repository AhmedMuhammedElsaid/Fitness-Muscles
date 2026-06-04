import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, router } from 'expo-router';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { PrimaryButton, TextInput } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { firstError } from '@/lib/formError';
import { useState } from 'react';

const signupSchema = z
  .object({
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export default function SignupScreen() {
  const signup = useAuthStore((s) => s.signup);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm({
    defaultValues: { email: '', password: '', confirmPassword: '' },
    validators: { onChange: signupSchema },
    onSubmit: async ({ value }) => {
      try {
        setError(null);
        setLoading(true);
        await signup(value.email, value.password);
        router.replace('/role-select');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Signup failed');
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-7 justify-center">
          <Text className="text-primary font-serif text-4xl italic text-center mb-2">
            Fitness &amp; Muscles
          </Text>
          <Text className="text-text-secondary text-center text-sm mb-10">
            Create your account
          </Text>

          {error && (
            <View className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
              <Text className="text-red-400 text-sm text-center">{error}</Text>
            </View>
          )}

          <View className="gap-4 mb-6">
            <form.Field name="email">
              {(field) => (
                <TextInput
                  label="Email"
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
            <form.Field name="password">
              {(field) => (
                <TextInput
                  label="Password"
                  placeholder="At least 8 characters"
                  secureTextEntry
                  value={field.state.value}
                  onChangeText={field.handleChange}
                  onBlur={field.handleBlur}
                  error={firstError(field.state.meta.errors)}
                />
              )}
            </form.Field>
            <form.Field name="confirmPassword">
              {(field) => (
                <TextInput
                  label="Confirm Password"
                  placeholder="Re-enter your password"
                  secureTextEntry
                  value={field.state.value}
                  onChangeText={field.handleChange}
                  onBlur={field.handleBlur}
                  error={firstError(field.state.meta.errors)}
                />
              )}
            </form.Field>
          </View>

          <PrimaryButton title="Create Account" loading={loading} onPress={() => form.handleSubmit()} />

          <View className="flex-row justify-center mt-6">
            <Text className="text-text-secondary text-sm">Already have an account? </Text>
            <Link href="/auth/login">
              <Text className="text-primary text-sm font-semibold">Sign In</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
