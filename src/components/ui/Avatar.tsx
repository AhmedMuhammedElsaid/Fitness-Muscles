import { View, Text } from 'react-native';
import { Image } from 'expo-image';

type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  uri?: string | null;
  name: string;
  size?: AvatarSize;
}

const DIAMETER: Record<AvatarSize, number> = { sm: 32, md: 48, lg: 80 };

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => ([...part][0] ?? '').toUpperCase())
    .join('');
}

export function Avatar({ uri, name, size = 'md' }: AvatarProps) {
  const diameter = DIAMETER[size];

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: diameter, height: diameter, borderRadius: diameter / 2 }}
        contentFit="cover"
      />
    );
  }

  return (
    <View
      className="bg-surface items-center justify-center"
      style={{ width: diameter, height: diameter, borderRadius: diameter / 2 }}
    >
      <Text className="text-white font-sans font-semibold" style={{ fontSize: diameter * 0.4 }}>
        {initials(name)}
      </Text>
    </View>
  );
}
