import { TouchableOpacity, Text, ActivityIndicator, type TouchableOpacityProps } from 'react-native';

interface PrimaryButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
}

export function PrimaryButton({ title, loading, disabled, className, ...props }: PrimaryButtonProps) {
  return (
    <TouchableOpacity
      className={`bg-primary rounded-button py-4 items-center justify-center ${disabled || loading ? 'opacity-50' : ''} ${className ?? ''}`}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color="#1A1A1A" />
      ) : (
        <Text className="text-background font-sans font-semibold text-base">{title}</Text>
      )}
    </TouchableOpacity>
  );
}

interface SecondaryButtonProps extends TouchableOpacityProps {
  title: string;
}

export function SecondaryButton({ title, className, ...props }: SecondaryButtonProps) {
  return (
    <TouchableOpacity
      className={`border border-primary rounded-button py-4 items-center justify-center ${className ?? ''}`}
      activeOpacity={0.8}
      {...props}
    >
      <Text className="text-primary font-sans font-semibold text-base">{title}</Text>
    </TouchableOpacity>
  );
}
