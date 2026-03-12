import { TouchableOpacity, Text, View } from 'react-native';

interface ToggleOptionProps {
  label: string;
  value: boolean;
  onToggle: (value: boolean) => void;
  className?: string;
}

export function ToggleOption({ label, value, onToggle, className }: ToggleOptionProps) {
  return (
    <View className={`flex-row items-center justify-between ${className ?? ''}`}>
      <Text className="text-white font-sans text-sm">{label}</Text>
      <View className="flex-row bg-surface rounded-full overflow-hidden border border-border">
        <TouchableOpacity
          onPress={() => onToggle(true)}
          className={`px-5 py-2 ${value ? 'bg-primary' : ''}`}
          activeOpacity={0.7}
        >
          <Text className={`text-sm font-sans ${value ? 'text-background font-semibold' : 'text-text-muted'}`}>
            Yes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onToggle(false)}
          className={`px-5 py-2 ${!value ? 'bg-primary' : ''}`}
          activeOpacity={0.7}
        >
          <Text className={`text-sm font-sans ${!value ? 'text-background font-semibold' : 'text-text-muted'}`}>
            No
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
