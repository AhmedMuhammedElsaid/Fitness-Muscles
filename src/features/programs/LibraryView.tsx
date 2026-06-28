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
import { exercisesCollection } from '@/db/collections';
import { createExercise, updateExercise, deleteExercise } from '@/db/mutations';
import { Image } from 'expo-image';
import { FlashList } from '@/lib/list';
import {
  PrimaryButton,
  SecondaryButton,
  TextInput,
  Card,
  IconButton,
  ChipSelector,
  EmptyState,
  Badge,
} from '@/components/ui';
import { firstError } from '@/lib/formError';
import { useDebouncedValue } from '@/lib/pacer';
import { extractVideoId, toThumbnailUrl } from '@/lib/youtube';
import { YouTubePlayer } from '@/components/YouTubePlayer';
import type { Tables } from '@/types/db';
import { ilike } from '@tanstack/db';

type Exercise = Tables<'exercises'>;

// Validate against the same parser used to store the video, so any link the app
// can actually play (youtu.be, m.youtube.com, shorts, share links) is accepted.
const exerciseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string(),
  videoUrl: z.string().refine(
    (v) => !v || extractVideoId(v) !== null,
    'Must be a valid YouTube URL',
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

export function LibraryView() {
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

  const allMatches: Exercise[] = (allExercises ?? []) as Exercise[];

  // Filter chip options come from the FULL library (not the search-filtered set),
  // so chips never vanish mid-search and orphan an active filter selection.
  const { data: fullLibrary } = useLiveQuery(exercisesCollection);
  const fullList: Exercise[] = (fullLibrary ?? []) as Exercise[];

  const [muscleFilters, setMuscleFilters] = useState<string[]>([]);
  const [equipmentFilters, setEquipmentFilters] = useState<string[]>([]);

  const muscleOptions = Array.from(
    new Set(fullList.map((e) => e.muscle_group).filter((g): g is string => !!g)),
  ).sort();
  const equipmentOptions = Array.from(
    new Set(fullList.map((e) => e.equipment).filter((g): g is string => !!g)),
  ).sort();

  const exercises = allMatches.filter(
    (e) =>
      (muscleFilters.length === 0 || (e.muscle_group != null && muscleFilters.includes(e.muscle_group))) &&
      (equipmentFilters.length === 0 || (e.equipment != null && equipmentFilters.includes(e.equipment))),
  );

  const toggleFilter = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
  ) => setter((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));

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
    <View className="flex-1 bg-background">
      <View className="flex-1">
        <View className="px-7 pt-4 pb-3 flex-row justify-between items-center">
          <Text className="text-white font-sans text-xl font-semibold">
            {t('coach.library.title', 'Exercise Library')}
          </Text>
          <IconButton
            name="add-circle"
            onPress={() => { setEditTarget(null); setFormVisible(true); }}
            accessibilityLabel={t('coach.library.addBtn', 'Add exercise')}
          />
        </View>

        <View className="px-7 mb-3">
          <TextInput
            placeholder={t('coach.library.search', 'Search exercises...')}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {(muscleOptions.length > 0 || equipmentOptions.length > 0) ? (
          <View className="px-7 mb-3 gap-2">
            {muscleOptions.length > 0 ? (
              <ChipSelector
                options={muscleOptions}
                selected={muscleFilters}
                onToggle={(v) => toggleFilter(v, setMuscleFilters)}
              />
            ) : null}
            {equipmentOptions.length > 0 ? (
              <ChipSelector
                options={equipmentOptions}
                selected={equipmentFilters}
                onToggle={(v) => toggleFilter(v, setEquipmentFilters)}
              />
            ) : null}
          </View>
        ) : null}

        {exercises.length === 0 ? (
          <View className="flex-1 items-center justify-center px-7">
            <EmptyState
              icon="barbell-outline"
              message={
                search || muscleFilters.length > 0 || equipmentFilters.length > 0
                  ? t('coach.library.noResults', 'No exercises match your search')
                  : t('coach.library.empty', 'No exercises yet. Tap + Add to create one.')
              }
            />
          </View>
        ) : (
          <FlashList
            data={exercises}

            contentContainerStyle={{ paddingHorizontal: 28, paddingBottom: 32 }}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const thumbId = item.video_url ? extractVideoId(item.video_url) : null;
              return (
                <Card className="mb-3">
                  <View className="flex-row items-center">
                    {thumbId ? (
                      <TouchableOpacity
                        onPress={() => setVideoTarget(item)}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityLabel={t('coach.library.playVideo', 'Play video')}
                        className="mr-3"
                      >
                        <Image
                          source={{ uri: toThumbnailUrl(thumbId) }}
                          style={{ width: 64, height: 48, borderRadius: 8 }}
                          contentFit="cover"
                        />
                      </TouchableOpacity>
                    ) : null}
                    <View className="flex-1 mr-1">
                      <Text className="text-white font-sans font-medium">{item.name}</Text>
                      <View className="flex-row flex-wrap gap-2 mt-1">
                        {item.muscle_group ? (
                          <Badge label={item.muscle_group} variant="muted" />
                        ) : null}
                        {item.equipment ? (
                          <Badge label={item.equipment} variant="muted" />
                        ) : null}
                      </View>
                    </View>
                    <View className="flex-row items-center">
                      <IconButton
                        name="create-outline"
                        onPress={() => { setEditTarget(item); setFormVisible(true); }}
                        accessibilityLabel={t('common.edit', 'Edit')}
                        size={18}
                      />
                      <IconButton
                        name="trash-outline"
                        onPress={() => handleDelete(item)}
                        accessibilityLabel={t('common.delete', 'Delete')}
                        variant="danger"
                        size={18}
                      />
                    </View>
                  </View>
                </Card>
              );
            }}
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
            <IconButton
              name="close"
              onPress={() => setVideoTarget(null)}
              accessibilityLabel={t('common.close', 'Close')}
            />
          </View>
          {videoId ? (
            <View className="w-full aspect-video">
              <YouTubePlayer videoId={videoId} />
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
    </View>
  );
}
