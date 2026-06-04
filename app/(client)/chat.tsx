import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { FlashList } from '@/lib/list';
import { useLiveQuery } from '@tanstack/react-db';
import { tipsCollection } from '@/db/collections';
import type { Tables } from '@/types/db';

type Tip = Tables<'tips'>;

function TipItem({ item }: { item: Tip }) {
  return (
    <View className="mx-7 mb-4 bg-surface rounded-card p-4">
      <Text className="text-white font-sans text-sm leading-5">{item.body}</Text>
      <Text className="text-text-muted font-sans text-xs mt-2">
        {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </View>
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
        <Text className="text-white font-sans text-xl font-semibold">
          {t('client.tips.title')}
        </Text>
      </View>

      {sorted.length === 0 ? (
        <View className="flex-1 items-center justify-center px-7">
          <Text className="text-text-secondary font-sans text-sm text-center">
            {t('client.tips.empty')}
          </Text>
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
