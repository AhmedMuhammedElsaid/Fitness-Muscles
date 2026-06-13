import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { FlashList } from '@/lib/list';
import { useLiveQuery } from '@tanstack/react-db';
import { tipsCollection } from '@/db/collections';
import { SectionHeader, EmptyState, Card, Icon } from '@/components/ui';
import { colors } from '@/theme/tokens';
import type { Tables } from '@/types/db';

type Tip = Tables<'tips'>;

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';

  const diffMs = Date.now() - then;
  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(then).toLocaleDateString();
}

function TipItem({ item }: { item: Tip }) {
  return (
    <Card className="mx-7 mb-4 p-5">
      <View className="flex-row items-center mb-3">
        <Icon name="bulb" size={18} color={colors.primary} />
      </View>
      <Text className="text-white font-sans text-sm leading-6">{item.body}</Text>
      <Text className="text-text-muted font-sans text-xs mt-3">
        {relativeTime(item.created_at)}
      </Text>
    </Card>
  );
}

export default function TipsFeedScreen() {
  const { t } = useTranslation();
  const { data: tips } = useLiveQuery(tipsCollection);

  const sorted = [...(tips ?? [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-7 mt-4 mb-3">
        <SectionHeader title={t('client.tips.title')} icon="bulb" />
        <Text className="text-text-secondary font-sans text-sm">
          {t('client.tips.subtitle')}
        </Text>
      </View>

      {sorted.length === 0 ? (
        <View className="flex-1 items-center justify-center px-7">
          <EmptyState icon="bulb-outline" message={t('client.tips.empty')} />
        </View>
      ) : (
        <FlashList
          data={sorted}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TipItem item={item} />}
          contentContainerStyle={{ paddingBottom: 32, paddingTop: 8 }}
        />
      )}
    </SafeAreaView>
  );
}
