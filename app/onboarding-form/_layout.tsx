import { Stack } from 'expo-router';
import { StepIndicator } from '@/components/ui';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { View } from 'react-native';

export default function OnboardingFormLayout() {
  const currentStep = useOnboardingStore((s) => s.currentStep);

  return (
    <View className="flex-1 bg-background">
      <View className="pt-16 pb-4">
        <StepIndicator currentStep={currentStep} totalSteps={8} />
      </View>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#1A1A1A' },
          animation: 'slide_from_right',
        }}
      />
    </View>
  );
}
