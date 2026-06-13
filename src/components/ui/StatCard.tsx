import { Text } from 'react-native';
import { Card } from './Card';
import { Icon, type IconName } from './Icon';
import { colors } from '@/theme/tokens';

interface StatCardProps {
  icon: IconName;
  value: string;
  label: string;
  iconColor?: string;
  className?: string;
}

export function StatCard({ icon, value, label, iconColor = colors.primary, className }: StatCardProps) {
  return (
    <Card className={`flex-1 items-center py-3 ${className ?? ''}`}>
      <Icon name={icon} size={20} color={iconColor} />
      <Text className="text-white font-sans font-semibold text-base mt-1.5" numberOfLines={1}>
        {value}
      </Text>
      <Text className="text-text-secondary font-sans text-xs mt-0.5 text-center" numberOfLines={1}>
        {label}
      </Text>
    </Card>
  );
}
