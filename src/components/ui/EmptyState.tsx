import { View, Text } from 'react-native';
import { Icon, type IconName } from './Icon';
import { colors } from '@/theme/tokens';

interface EmptyStateProps {
  icon?: IconName;
  message: string;
  className?: string;
}

export function EmptyState({ icon = 'sparkles-outline', message, className }: EmptyStateProps) {
  return (
    <View className={`items-center justify-center py-8 px-4 ${className ?? ''}`}>
      <Icon name={icon} size={32} color={colors.textMuted} />
      <Text className="text-text-secondary font-sans text-sm text-center mt-3">{message}</Text>
    </View>
  );
}
