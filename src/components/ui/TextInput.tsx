import { TextInput as RNTextInput, View, Text, Pressable, type TextInputProps } from 'react-native';
import { forwardRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

interface StyledTextInputProps extends TextInputProps {
  label?: string;
  error?: string;
  /** Renders an eye toggle that shows/hides the entered text (for password fields). */
  passwordToggle?: boolean;
}

export const TextInput = forwardRef<RNTextInput, StyledTextInputProps>(
  ({ label, error, className, passwordToggle, secureTextEntry, ...props }, ref) => {
    const [hidden, setHidden] = useState(true);
    const borderClass = error ? 'border border-red-500' : 'border border-border';

    return (
      <View className="w-full">
        {label && (
          <Text className="text-text-secondary text-xs font-sans mb-1.5">{label}</Text>
        )}
        {passwordToggle ? (
          // flex-row flips automatically under RTL, keeping the eye on the trailing edge.
          <View className={`flex-row items-center bg-surface rounded-lg ${borderClass}`}>
            <RNTextInput
              ref={ref}
              secureTextEntry={hidden}
              className={`flex-1 px-4 py-3.5 text-white font-sans text-sm ${className ?? ''}`}
              placeholderTextColor="#666666"
              {...props}
            />
            <Pressable
              onPress={() => setHidden((h) => !h)}
              className="px-4 py-3.5"
              hitSlop={8}
              accessibilityRole="button"
            >
              <Ionicons
                name={hidden ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#666666"
              />
            </Pressable>
          </View>
        ) : (
          <RNTextInput
            ref={ref}
            secureTextEntry={secureTextEntry}
            className={`bg-surface rounded-lg px-4 py-3.5 text-white font-sans text-sm ${borderClass} ${className ?? ''}`}
            placeholderTextColor="#666666"
            {...props}
          />
        )}
        {error && (
          <Text className="text-red-500 text-xs font-sans mt-1">{error}</Text>
        )}
      </View>
    );
  },
);

TextInput.displayName = 'TextInput';
