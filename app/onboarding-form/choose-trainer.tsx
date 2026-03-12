import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { PrimaryButton } from '@/components/ui';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useEffect } from 'react';

export default function ChooseTrainerStep() {
  const { setStep } = useOnboardingStore();
  useEffect(() => { setStep(8); }, [setStep]);

  return (
    <View className="flex-1 px-7 items-center justify-center">
      <Text className="text-white font-sans text-xl font-semibold mb-2 text-center">
        Find Your Trainer
      </Text>
      <Text className="text-text-secondary text-sm text-center mb-8">
        Browse our trainers and find the perfect match for your fitness goals.
      </Text>

      {/* TODO: Trainer list with matchmaking results */}

      <PrimaryButton
        title="Get Started"
        onPress={() => router.replace('/(client)/home')}
        className="w-full"
      />
    </View>
  );
}
