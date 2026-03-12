import { TouchableOpacity, Text, View } from 'react-native';

interface ChipSelectorProps {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  className?: string;
}

export function ChipSelector({ options, selected, onToggle, className }: ChipSelectorProps) {
  return (
    <View className={`flex-row flex-wrap gap-2 ${className ?? ''}`}>
      {options.map((option) => {
        const isSelected = selected.includes(option);
        return (
          <TouchableOpacity
            key={option}
            onPress={() => onToggle(option)}
            className={`px-4 py-2 rounded-full border ${
              isSelected
                ? 'bg-primary border-primary'
                : 'bg-surface border-border'
            }`}
            activeOpacity={0.7}
          >
            <Text
              className={`text-sm font-sans ${
                isSelected ? 'text-background font-semibold' : 'text-text-secondary'
              }`}
            >
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
