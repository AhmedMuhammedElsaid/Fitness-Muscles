import { View, I18nManager } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { EmptyState } from './EmptyState';
import { colors } from '@/theme/tokens';

export interface TrendPoint {
  label: string;
  value: number;
}

interface TrendChartProps {
  data: TrendPoint[];
  emptyMessage: string;
  height?: number;
}

export function TrendChart({ data, emptyMessage, height = 150 }: TrendChartProps) {
  const hasData = data.some((d) => d.value > 0);
  if (!hasData) {
    return <EmptyState icon="bar-chart-outline" message={emptyMessage} />;
  }

  const ordered = I18nManager.isRTL ? [...data].reverse() : data;
  const barData = ordered.map((d) => ({
    value: d.value,
    label: d.label,
    frontColor: colors.primary,
  }));

  return (
    <View className="overflow-hidden">
      <BarChart
        data={barData}
        height={height}
        barWidth={18}
        spacing={20}
        initialSpacing={12}
        barBorderRadius={4}
        frontColor={colors.primary}
        hideRules
        yAxisThickness={0}
        xAxisThickness={1}
        xAxisColor={colors.border}
        yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10 }}
        noOfSections={3}
        isAnimated
        disableScroll
      />
    </View>
  );
}
