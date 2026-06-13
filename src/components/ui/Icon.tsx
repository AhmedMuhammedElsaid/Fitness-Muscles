import { I18nManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/tokens';

export type IconName = keyof typeof Ionicons.glyphMap;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  /** Mirror horizontally under RTL — use for directional glyphs (arrows, chevrons). */
  flipRTL?: boolean;
}

export function Icon({ name, size = 20, color = colors.textPrimary, flipRTL = false }: IconProps) {
  const style = flipRTL && I18nManager.isRTL ? { transform: [{ scaleX: -1 as number }] } : undefined;
  return <Ionicons name={name} size={size} color={color} style={style} />;
}
