import { View, Text } from 'react-native';
import { Icon } from './Icon';
import { colors } from '@/theme/tokens';

const FLAME_ACTIVE = '#FF7A33';

interface StreakBadgeProps {
  days: number;
  label: string;
  className?: string;
}

export function StreakBadge({ days, label, className }: StreakBadgeProps) {
  const active = days > 0;
  return (
    <View className={`flex-row items-center gap-1.5 bg-surface rounded-full px-3 py-1.5 ${className ?? ''}`}>
      <Icon name="flame" size={16} color={active ? FLAME_ACTIVE : colors.textMuted} />
      <Text className={`font-sans text-xs font-semibold ${active ? 'text-white' : 'text-text-muted'}`}>
        {days} {label}
      </Text>
    </View>
  );
}
