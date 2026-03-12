import { View, Text } from 'react-native';
import { ProgressBar } from './ProgressBar';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <View className="px-6">
      <Text className="text-text-secondary text-xs font-sans mb-2">
        Step {currentStep}/{totalSteps}
      </Text>
      <ProgressBar progress={progress} showPercentage={false} />
    </View>
  );
}
