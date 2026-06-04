import { View, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from '@tanstack/react-db';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { tipsCollection } from '@/db/collections';
import { postTip } from '@/db/mutations';
import { FlashList } from '@/lib/list';
import { PrimaryButton, TextInput, Card } from '@/components/ui';
import { firstError } from '@/lib/formError';
import type { Tables } from '@/types/db';

type Tip = Tables<'tips'>;

const tipSchema = z.object({
  body: z
    .string()
    .min(1, 'Tip cannot be empty')
    .max(2000, 'Max 2000 characters'),
});

export default function TipsScreen() {
  const { t } = useTranslation();
  const { data: tips } = useLiveQuery(tipsCollection);

  const sortedTips = [...((tips ?? []) as Tip[])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const form = useForm({
    defaultValues: { body: '' },
    validators: { onChange: tipSchema },
    onSubmit: async ({ value }) => {
      await postTip(value.body);
      form.reset();
    },
  });

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="px-7 pt-4 pb-3">
          <Text className="text-white font-sans text-xl font-semibold">
            {t('coach.tips.title', 'Tips')}
          </Text>
        </View>

        {/* Composer */}
        <View className="px-7 pb-4 border-b border-surface">
          <form.Field name="body">
            {(f) => (
              <TextInput
                placeholder={t('coach.tips.placeholder', 'Share a tip with your clients...')}
                multiline
                numberOfLines={3}
                value={f.state.value}
                onChangeText={f.handleChange}
                onBlur={f.handleBlur}
                error={firstError(f.state.meta.errors)}
              />
            )}
          </form.Field>
          <View className="flex-row justify-between items-center mt-2">
            <form.Subscribe selector={(s) => s.values.body}>
              {(body) => (
                <Text className="text-text-muted font-sans text-xs">
                  {body.length}/2000
                </Text>
              )}
            </form.Subscribe>
            <form.Subscribe selector={(s) => s.isSubmitting}>
              {(isSubmitting) => (
                <PrimaryButton
                  title={isSubmitting ? t('common.saving', 'Posting...') : t('coach.tips.post', 'Post')}
                  loading={isSubmitting}
                  onPress={() => form.handleSubmit()}
                  className="w-24"
                />
              )}
            </form.Subscribe>
          </View>
        </View>

        {/* Tips feed */}
        {sortedTips.length === 0 ? (
          <View className="flex-1 items-center justify-center px-7">
            <Text className="text-text-secondary font-sans text-sm text-center">
              {t('coach.tips.empty', "No tips posted yet. Your clients will see them here.")}
            </Text>
          </View>
        ) : (
          <FlashList
            data={sortedTips}

            contentContainerStyle={{ paddingHorizontal: 28, paddingTop: 12, paddingBottom: 32 }}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Card className="mb-3">
                <Text className="text-white font-sans text-sm leading-relaxed">{item.body}</Text>
                <Text className="text-text-muted font-sans text-xs mt-2">
                  {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </Card>
            )}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
