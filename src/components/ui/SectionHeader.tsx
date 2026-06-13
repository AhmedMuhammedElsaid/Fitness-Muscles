import { View, Text, TouchableOpacity } from 'react-native';
import { Icon, type IconName } from './Icon';
import { colors } from '@/theme/tokens';

interface SectionHeaderProps {
  title: string;
  icon?: IconName;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function SectionHeader({ title, icon, actionLabel, onAction, className }: SectionHeaderProps) {
  return (
    <View className={`flex-row items-center justify-between mb-3 ${className ?? ''}`}>
      <View className="flex-row items-center gap-2">
        {icon ? <Icon name={icon} size={18} color={colors.primary} /> : null}
        <Text className="text-white font-sans font-semibold text-base">{title}</Text>
      </View>
      {actionLabel && onAction ? (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7} hitSlop={8}>
          <Text className="text-primary font-sans text-xs">{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
