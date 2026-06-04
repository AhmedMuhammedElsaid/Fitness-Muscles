import { View, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useForm } from '@tanstack/react-form';
import { PrimaryButton, TextInput } from '@/components/ui';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useEffect } from 'react';

export default function BodyMetricsStep() {
  const { formData, updateFormData, setStep } = useOnboardingStore();
  useEffect(() => {
    setStep(3);
  }, [setStep]);

  const form = useForm({
    defaultValues: {
      currentWeight: formData.currentWeight?.toString() || '',
      targetWeight: formData.targetWeight?.toString() || '',
      heightFt: formData.heightFt?.toString() || '',
      heightIn: formData.heightIn?.toString() || '',
    },
    onSubmit: ({ value }) => {
      updateFormData({
        currentWeight: value.currentWeight ? parseFloat(value.currentWeight) : undefined,
        targetWeight: value.targetWeight ? parseFloat(value.targetWeight) : undefined,
        heightFt: value.heightFt ? parseInt(value.heightFt, 10) : undefined,
        heightIn: value.heightIn ? parseInt(value.heightIn, 10) : undefined,
      });
      router.push('/onboarding-form/health-restrictions');
    },
  });

  return (
    <ScrollView className="flex-1" contentContainerClassName="px-7 pb-8" keyboardShouldPersistTaps="handled">
      <Text className="text-white font-sans text-xl font-semibold mb-1 mt-6">Body Metrics</Text>
      <Text className="text-text-secondary text-sm mb-8">Help us understand your body</Text>

      <View className="gap-4">
        <View className="flex-row gap-4">
          <View className="flex-1">
            <form.Field name="heightFt">
              {(field) => (
                <TextInput label="Height (ft)" placeholder="5" keyboardType="numeric" onChangeText={field.handleChange} value={field.state.value} />
              )}
            </form.Field>
          </View>
          <View className="flex-1">
            <form.Field name="heightIn">
              {(field) => (
                <TextInput label="Height (in)" placeholder="10" keyboardType="numeric" onChangeText={field.handleChange} value={field.state.value} />
              )}
            </form.Field>
          </View>
        </View>
        <form.Field name="currentWeight">
          {(field) => (
            <TextInput label="Current Weight (lbs)" placeholder="160" keyboardType="numeric" onChangeText={field.handleChange} value={field.state.value} />
          )}
        </form.Field>
        <form.Field name="targetWeight">
          {(field) => (
            <TextInput label="Target Weight (lbs)" placeholder="150" keyboardType="numeric" onChangeText={field.handleChange} value={field.state.value} />
          )}
        </form.Field>
      </View>

      <PrimaryButton title="Continue" onPress={() => form.handleSubmit()} className="mt-8" />
    </ScrollView>
  );
}
