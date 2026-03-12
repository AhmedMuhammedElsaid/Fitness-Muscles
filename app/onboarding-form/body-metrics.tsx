import { View, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { PrimaryButton, TextInput } from '@/components/ui';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useEffect } from 'react';

export default function BodyMetricsStep() {
  const { formData, updateFormData, setStep } = useOnboardingStore();
  useEffect(() => { setStep(3); }, [setStep]);

  const { control, handleSubmit } = useForm({
    defaultValues: {
      currentWeight: formData.currentWeight?.toString() || '',
      targetWeight: formData.targetWeight?.toString() || '',
      heightFt: formData.heightFt?.toString() || '',
      heightIn: formData.heightIn?.toString() || '',
    },
  });

  const onNext = (data: Record<string, string>) => {
    updateFormData({
      currentWeight: data.currentWeight ? parseFloat(data.currentWeight) : undefined,
      targetWeight: data.targetWeight ? parseFloat(data.targetWeight) : undefined,
      heightFt: data.heightFt ? parseInt(data.heightFt) : undefined,
      heightIn: data.heightIn ? parseInt(data.heightIn) : undefined,
    });
    router.push('/onboarding-form/health-restrictions');
  };

  return (
    <ScrollView className="flex-1" contentContainerClassName="px-7 pb-8" keyboardShouldPersistTaps="handled">
      <Text className="text-white font-sans text-xl font-semibold mb-1 mt-6">Body Metrics</Text>
      <Text className="text-text-secondary text-sm mb-8">Help us understand your body</Text>

      <View className="gap-4">
        <View className="flex-row gap-4">
          <View className="flex-1">
            <Controller control={control} name="heightFt" render={({ field: { onChange, value } }) => (
              <TextInput label="Height (ft)" placeholder="5" keyboardType="numeric" onChangeText={onChange} value={value} />
            )} />
          </View>
          <View className="flex-1">
            <Controller control={control} name="heightIn" render={({ field: { onChange, value } }) => (
              <TextInput label="Height (in)" placeholder="10" keyboardType="numeric" onChangeText={onChange} value={value} />
            )} />
          </View>
        </View>
        <Controller control={control} name="currentWeight" render={({ field: { onChange, value } }) => (
          <TextInput label="Current Weight (lbs)" placeholder="160" keyboardType="numeric" onChangeText={onChange} value={value} />
        )} />
        <Controller control={control} name="targetWeight" render={({ field: { onChange, value } }) => (
          <TextInput label="Target Weight (lbs)" placeholder="150" keyboardType="numeric" onChangeText={onChange} value={value} />
        )} />
      </View>

      <PrimaryButton title="Continue" onPress={handleSubmit(onNext)} className="mt-8" />
    </ScrollView>
  );
}
