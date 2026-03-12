import { TextInput as RNTextInput, View, Text, type TextInputProps } from 'react-native';
import { forwardRef } from 'react';

interface StyledTextInputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const TextInput = forwardRef<RNTextInput, StyledTextInputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <View className="w-full">
        {label && (
          <Text className="text-text-secondary text-xs font-sans mb-1.5">{label}</Text>
        )}
        <RNTextInput
          ref={ref}
          className={`bg-surface rounded-lg px-4 py-3.5 text-white font-sans text-sm ${
            error ? 'border border-red-500' : 'border border-border'
          } ${className ?? ''}`}
          placeholderTextColor="#666666"
          {...props}
        />
        {error && (
          <Text className="text-red-500 text-xs font-sans mt-1">{error}</Text>
        )}
      </View>
    );
  },
);

TextInput.displayName = 'TextInput';
