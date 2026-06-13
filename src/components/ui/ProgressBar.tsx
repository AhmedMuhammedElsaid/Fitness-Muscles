import { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  className?: string;
}

export function ProgressBar({ progress, label, showPercentage = true, className }: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(clampedProgress, { duration: 700, easing: Easing.out(Easing.cubic) });
  }, [clampedProgress, width]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${width.value}%` }));

  return (
    <View className={`w-full ${className ?? ''}`}>
      {(label || showPercentage) && (
        <View className="flex-row justify-between mb-1.5">
          {label && <Text className="text-text-secondary text-xs font-sans">{label}</Text>}
          {showPercentage && (
            <Text className="text-primary text-xs font-sans">{Math.round(clampedProgress)}%</Text>
          )}
        </View>
      )}
      <View className="h-2 bg-progress-track rounded-full overflow-hidden">
        <Animated.View className="h-full bg-progress-fill rounded-full" style={fillStyle} />
      </View>
    </View>
  );
}
