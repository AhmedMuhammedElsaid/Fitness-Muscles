import { View, Text, TouchableOpacity } from 'react-native';

interface Segment {
  key: string;
  label: string;
}

interface SegmentedControlProps {
  segments: Segment[];
  value: string;
  onChange: (key: string) => void;
  className?: string;
}

export function SegmentedControl({ segments, value, onChange, className }: SegmentedControlProps) {
  return (
    <View className={`flex-row bg-surface rounded-full p-1 ${className ?? ''}`}>
      {segments.map((segment) => {
        const selected = segment.key === value;
        return (
          <TouchableOpacity
            key={segment.key}
            onPress={() => onChange(segment.key)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            className={`flex-1 items-center justify-center rounded-full py-1.5 ${
              selected ? 'bg-primary' : ''
            }`}
          >
            <Text
              className={`font-sans text-xs font-semibold ${
                selected ? 'text-background' : 'text-text-secondary'
              }`}
              numberOfLines={1}
            >
              {segment.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
