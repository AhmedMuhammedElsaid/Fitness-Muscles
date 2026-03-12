import { View, type ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  elevated?: boolean;
}

export function Card({ elevated, className, children, ...props }: CardProps) {
  return (
    <View
      className={`${elevated ? 'bg-surface-elevated' : 'bg-surface'} rounded-card p-4 ${className ?? ''}`}
      {...props}
    >
      {children}
    </View>
  );
}
