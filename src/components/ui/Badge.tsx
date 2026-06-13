import { View, Text } from 'react-native';
import { colors } from '@/theme/tokens';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'muted';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
}

const VARIANT_COLOR: Record<BadgeVariant, string> = {
  success: colors.success,
  warning: colors.warning,
  danger: colors.danger,
  muted: colors.textMuted,
};

const TINT = '20';

export function Badge({ label, variant = 'muted', className }: BadgeProps) {
  const color = VARIANT_COLOR[variant];
  return (
    <View
      className={`rounded-full px-2.5 py-0.5 ${className ?? ''}`}
      style={{ backgroundColor: `${color}${TINT}` }}
    >
      <Text className="font-sans font-semibold text-xs" style={{ color }}>
        {label}
      </Text>
    </View>
  );
}
