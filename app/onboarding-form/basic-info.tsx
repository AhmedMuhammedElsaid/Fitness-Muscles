import { View, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { PrimaryButton, TextInput } from '@/components/ui';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { firstError } from '@/lib/formError';
import { useEffect } from 'react';

const schema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.string().min(1, 'Gender is required'),
  city: z.string(),
  country: z.string(),
});

export default function BasicInfoStep() {
  const { formData, updateFormData, setStep } = useOnboardingStore();

  useEffect(() => {
    setStep(1);
  }, [setStep]);

  const form = useForm({
    defaultValues: {
      fullName: formData.fullName || '',
      dateOfBirth: formData.dateOfBirth || '',
      gender: formData.gender || '',
      city: formData.city || '',
      country: formData.country || '',
    },
    validators: { onChange: schema },
    onSubmit: ({ value }) => {
      updateFormData(value);
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
        Basic Information
      </Text>
      <Text className="text-text-secondary text-sm mb-8">
        Tell us a bit about yourself
      </Text>

      <View className="gap-4">
        <form.Field name="fullName">
          {(field) => (
            <TextInput
              label="Full Name"
              placeholder="John Doe"
              value={field.state.value}
              onChangeText={field.handleChange}
              onBlur={field.handleBlur}
              error={firstError(field.state.meta.errors)}
            />
          )}
        </form.Field>
        <form.Field name="dateOfBirth">
          {(field) => (
            <TextInput
              label="Date of Birth"
              placeholder="YYYY-MM-DD"
              value={field.state.value}
              onChangeText={field.handleChange}
              onBlur={field.handleBlur}
              error={firstError(field.state.meta.errors)}
            />
          )}
        </form.Field>
        <form.Field name="gender">
          {(field) => (
            <TextInput
              label="Gender"
              placeholder="Male / Female / Other"
              value={field.state.value}
              onChangeText={field.handleChange}
              onBlur={field.handleBlur}
              error={firstError(field.state.meta.errors)}
            />
          )}
        </form.Field>
        <form.Field name="city">
          {(field) => (
            <TextInput
              label="City (optional)"
              placeholder="New York"
              value={field.state.value}
              onChangeText={field.handleChange}
              onBlur={field.handleBlur}
            />
          )}
        </form.Field>
        <form.Field name="country">
          {(field) => (
            <TextInput
              label="Country (optional)"
              placeholder="United States"
              value={field.state.value}
              onChangeText={field.handleChange}
              onBlur={field.handleBlur}
            />
          )}
        </form.Field>
      </View>

      <PrimaryButton title="Continue" onPress={() => form.handleSubmit()} className="mt-8" />
    </ScrollView>
  );
}
