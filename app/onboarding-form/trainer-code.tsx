import { View, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { PrimaryButton, SecondaryButton, TextInput, ToggleOption } from '@/components/ui';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useEffect, useState } from 'react';

export default function TrainerCodeStep() {
  const { formData, updateFormData, setStep } = useOnboardingStore();
  useEffect(() => { setStep(7); }, [setStep]);

  const [hasTrainer, setHasTrainer] = useState(formData.hasTrainer ?? false);
  const [code, setCode] = useState(formData.trainerCode || '');

  const onNext = () => {
    updateFormData({ hasTrainer, trainerCode: hasTrainer ? code : undefined });
    if (hasTrainer && code) {
      router.push('/onboarding-form/request-sent');
    } else {
      router.push('/onboarding-form/choose-trainer');
    }
  };

  return (
    <ScrollView className="flex-1" contentContainerClassName="px-7 pb-8">
      <Text className="text-white font-sans text-xl font-semibold mb-1 mt-6">Trainer Code</Text>
      <Text className="text-text-secondary text-sm mb-8">
        Got a trainer code? Enter it to connect directly.
      </Text>

      <ToggleOption label="Do you have a trainer code?" value={hasTrainer} onToggle={setHasTrainer} className="mb-6" />

      {hasTrainer && (
        <View className="mb-6">
          <TextInput
            label="Trainer Code"
            placeholder="ST-XXXXX"
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
          />
        </View>
      )}

      <PrimaryButton title={hasTrainer ? 'Connect with Trainer' : 'Find a Trainer'} onPress={onNext} />
      <SecondaryButton title="Skip for now" onPress={() => router.replace('/(client)/home')} className="mt-3" />
    </ScrollView>
  );
}
