import { View, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PrimaryButton, TextInput } from '@/components/ui';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useEffect } from 'react';

const schema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.string().min(1, 'Gender is required'),
  city: z.string().optional(),
  country: z.string().optional(),
});

type BasicInfoForm = z.infer<typeof schema>;

export default function BasicInfoStep() {
  const { formData, updateFormData, setStep } = useOnboardingStore();

  useEffect(() => { setStep(1); }, [setStep]);

  const { control, handleSubmit, formState: { errors } } = useForm<BasicInfoForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: formData.fullName || '',
      dateOfBirth: formData.dateOfBirth || '',
      gender: formData.gender || '',
      city: formData.city || '',
      country: formData.country || '',
    },
  });

  const onNext = (data: BasicInfoForm) => {
    updateFormData(data);
    router.push('/onboarding-form/fitness-goals');
  };

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
        <Controller
          control={control}
          name="fullName"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Full Name"
              placeholder="John Doe"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.fullName?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="dateOfBirth"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Date of Birth"
              placeholder="YYYY-MM-DD"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.dateOfBirth?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="gender"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Gender"
              placeholder="Male / Female / Other"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.gender?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="city"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="City (optional)"
              placeholder="New York"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
        <Controller
          control={control}
          name="country"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Country (optional)"
              placeholder="United States"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
        />
      </View>

      <PrimaryButton title="Continue" onPress={handleSubmit(onNext)} className="mt-8" />
    </ScrollView>
  );
}
