import { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from '@tanstack/react-db';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import WebView from 'react-native-webview';
import { exercisesCollection } from '@/db/collections';
import { createExercise, updateExercise, deleteExercise } from '@/db/mutations';
import { FlashList } from '@/lib/list';
import { PrimaryButton, SecondaryButton, TextInput, Card } from '@/components/ui';
import { firstError } from '@/lib/formError';
import { useDebouncedValue } from '@/lib/pacer';
import { extractVideoId, toEmbedUrl } from '@/lib/youtube';
import type { Tables } from '@/types/db';
import { ilike } from '@tanstack/db';

type Exercise = Tables<'exercises'>;

const YOUTUBE_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/i;

const exerciseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string(),
  videoUrl: z.string().refine(
    (v) => !v || YOUTUBE_REGEX.test(v),
    'Must be a YouTube URL',
  ),
  muscleGroup: z.string(),
  equipment: z.string(),
});

type ExerciseFormValues = z.infer<typeof exerciseSchema>;

function ExerciseForm({
  initial,
  onSave,
  onCancel,
  loading,
}: {
  initial?: Partial<ExerciseFormValues>;
  onSave: (values: ExerciseFormValues) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}) {
  const { t } = useTranslation();
  const form = useForm({
    defaultValues: {
      name: initial?.name ?? '',
      description: initial?.description ?? '',
      videoUrl: initial?.videoUrl ?? '',
      muscleGroup: initial?.muscleGroup ?? '',
      equipment: initial?.equipment ?? '',
    },
    validators: { onChange: exerciseSchema },
    onSubmit: async ({ value }) => onSave(value),
  });

  return (
    <ScrollView keyboardShouldPersistTaps="handled" className="flex-1">
      <View className="gap-4 pb-4">
        <form.Field name="name">
          {(f) => (
            <TextInput
              label={t('coach.library.form.name', 'Name *')}
              placeholder="e.g. Bench Press"
              value={f.state.value}
              onChangeText={f.handleChange}
              onBlur={f.handleBlur}
              error={firstError(f.state.meta.errors)}
            />
          )}
        </form.Field>
        <form.Field name="description">
          {(f) => (
            <TextInput
              label={t('coach.library.form.description', 'Description')}
              placeholder="Optional instructions..."
              multiline
              numberOfLines={3}
              value={f.state.value}
              onChangeText={f.handleChange}
              onBlur={f.handleBlur}
            />
          )}
        </form.Field>
        <form.Field name="videoUrl">
          {(f) => (
            <TextInput
              label={t('coach.library.form.videoUrl', 'YouTube URL')}
              placeholder="https://youtube.com/watch?v=..."
              autoCapitalize="none"
              keyboardType="url"
              value={f.state.value}
              onChangeText={f.handleChange}
              onBlur={f.handleBlur}
              error={firstError(f.state.meta.errors)}
            />
          )}
        </form.Field>
        <form.Field name="muscleGroup">
          {(f) => (
            <TextInput
              label={t('coach.library.form.muscleGroup', 'Muscle Group')}
              placeholder="e.g. Chest, Back..."
              value={f.state.value}
              onChangeText={f.handleChange}
              onBlur={f.handleBlur}
            />
          )}
        </form.Field>
        <form.Field name="equipment">
          {(f) => (
            <TextInput
              label={t('coach.library.form.equipment', 'Equipment')}
              placeholder="e.g. Barbell, Dumbbell..."
              value={f.state.value}
              onChangeText={f.handleChange}
              onBlur={f.handleBlur}
            />
          )}
        </form.Field>
        <PrimaryButton
          title={loading ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
          loading={loading}
          onPress={() => form.handleSubmit()}
        />
        <SecondaryButton title={t('common.cancel', 'Cancel')} onPress={onCancel} />
      </View>
    </ScrollView>
  );
}

export default function LibraryScreen() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);

  const { data: allExercises } = useLiveQuery(
    (q) => {
      const base = q.from({ e: exercisesCollection });
      if (debouncedSearch.trim()) {
        return base
          .where(({ e }) => ilike(e.name, `%${debouncedSearch}%`))
          .select(({ e }) => e);
      }
      return base.select(({ e }) => e);
    },
    [debouncedSearch],
  );

  const exercises: Exercise[] = (allExercises ?? []) as Exercise[];

  const [formVisible, setFormVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<Exercise | null>(null);
  const [videoTarget, setVideoTarget] = useState<Exercise | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async (values: ExerciseFormValues) => {
    setSaving(true);
    try {
      if (editTarget) {
        await updateExercise(editTarget.id, {
          name: values.name,
          description: values.description || null,
          videoUrl: values.videoUrl || null,
          muscleGroup: values.muscleGroup || null,
          equipment: values.equipment || null,
        });
      } else {
        await createExercise({
          name: values.name,
          description: values.description || null,
          videoUrl: values.videoUrl || null,
          muscleGroup: values.muscleGroup || null,
          equipment: values.equipment || null,
        });
      }
      setFormVisible(false);
      setEditTarget(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (ex: Exercise) => {
    Alert.alert(
      t('coach.library.deleteTitle', 'Delete Exercise'),
      t('coach.library.deleteConfirm', `Delete "${ex.name}"?`),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('common.delete', 'Delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteExercise(ex.id);
            } catch {
              // toast already fired
            }
          },
        },
      ],
    );
  };

  const videoId = videoTarget?.video_url ? extractVideoId(videoTarget.video_url) : null;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-1">
        <View className="px-7 pt-4 pb-3 flex-row justify-between items-center">
          <Text className="text-white font-sans text-xl font-semibold">
            {t('coach.library.title', 'Exercise Library')}
          </Text>
          <TouchableOpacity
            onPress={() => { setEditTarget(null); setFormVisible(true); }}
            className="bg-primary/20 border border-primary/40 rounded-lg px-3 py-2"
          >
            <Text className="text-primary font-sans text-sm font-medium">
              {t('coach.library.addBtn', '+ Add')}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="px-7 mb-3">
          <TextInput
            placeholder={t('coach.library.search', 'Search exercises...')}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {exercises.length === 0 ? (
          <View className="flex-1 items-center justify-center px-7">
            <Text className="text-text-secondary font-sans text-sm text-center">
              {search
                ? t('coach.library.noResults', 'No exercises match your search')
                : t('coach.library.empty', 'No exercises yet. Tap + Add to create one.')}
            </Text>
          </View>
        ) : (
          <FlashList
            data={exercises}

            contentContainerStyle={{ paddingHorizontal: 28, paddingBottom: 32 }}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Card className="mb-3">
                <View className="flex-row justify-between items-start">
                  <View className="flex-1 mr-3">
                    <Text className="text-white font-sans font-medium">{item.name}</Text>
                    {item.muscle_group ? (
                      <Text className="text-text-secondary font-sans text-xs mt-0.5">
                        {item.muscle_group}
                      </Text>
                    ) : null}
                  </View>
                  <View className="flex-row gap-2">
                    {item.video_url ? (
                      <TouchableOpacity
                        onPress={() => setVideoTarget(item)}
                        className="bg-primary/20 rounded-md px-2 py-1"
                      >
                        <Text className="text-primary font-sans text-xs">▶</Text>
                      </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity
                      onPress={() => { setEditTarget(item); setFormVisible(true); }}
                      className="bg-surface rounded-md px-2 py-1"
                    >
                      <Text className="text-text-secondary font-sans text-xs">
                        {t('common.edit', 'Edit')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(item)}
                      className="bg-red-500/20 rounded-md px-2 py-1"
                    >
                      <Text className="text-red-400 font-sans text-xs">
                        {t('common.delete', 'Del')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            )}
          />
        )}
      </View>

      {/* Create / Edit Modal */}
      <Modal
        visible={formVisible}
        animationType="slide"
        onRequestClose={() => setFormVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
          >
            <View className="px-7 pt-4 pb-2 flex-row justify-between items-center">
              <Text className="text-white font-sans text-lg font-semibold">
                {editTarget
                  ? t('coach.library.editTitle', 'Edit Exercise')
                  : t('coach.library.createTitle', 'New Exercise')}
              </Text>
            </View>
            <View className="flex-1 px-7">
              <ExerciseForm
                initial={
                  editTarget
                    ? {
                        name: editTarget.name,
                        description: editTarget.description ?? '',
                        videoUrl: editTarget.video_url ?? '',
                        muscleGroup: editTarget.muscle_group ?? '',
                        equipment: editTarget.equipment ?? '',
                      }
                    : undefined
                }
                onSave={handleSave}
                onCancel={() => { setFormVisible(false); setEditTarget(null); }}
                loading={saving}
              />
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Video Player Modal */}
      <Modal
        visible={videoTarget !== null}
        animationType="slide"
        onRequestClose={() => setVideoTarget(null)}
      >
        <SafeAreaView className="flex-1 bg-black" edges={['top', 'bottom']}>
          <View className="flex-row justify-between items-center px-7 py-4">
            <Text className="text-white font-sans font-medium flex-1 mr-4" numberOfLines={1}>
              {videoTarget?.name ?? ''}
            </Text>
            <TouchableOpacity onPress={() => setVideoTarget(null)}>
              <Text className="text-primary font-sans">✕</Text>
            </TouchableOpacity>
          </View>
          {videoId ? (
            <View className="w-full aspect-video">
              <WebView
                source={{ uri: toEmbedUrl(videoId) }}
                allowsFullscreenVideo
                mediaPlaybackRequiresUserAction={false}
                javaScriptEnabled
                className="flex-1"
              />
            </View>
          ) : (
            <View className="flex-1 items-center justify-center">
              <Text className="text-text-secondary font-sans text-sm">
                {t('coach.library.noVideo', 'No video available')}
              </Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
