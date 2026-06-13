import { TouchableOpacity } from 'react-native';
import { Icon, type IconName } from './Icon';
import { colors } from '@/theme/tokens';

interface IconButtonProps {
  name: IconName;
  onPress: () => void;
  accessibilityLabel: string;
  variant?: 'default' | 'danger';
  size?: number;
  disabled?: boolean;
}

export function IconButton({
  name,
  onPress,
  accessibilityLabel,
  variant = 'default',
  size = 20,
  disabled = false,
}: IconButtonProps) {
  const color = variant === 'danger' ? colors.danger : colors.textSecondary;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      hitSlop={8}
      className="items-center justify-center p-2.5"
      style={{ opacity: disabled ? 0.4 : 1 }}
    >
      <Icon name={name} size={size} color={color} />
    </TouchableOpacity>
  );
}
