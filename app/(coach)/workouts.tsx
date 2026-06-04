import { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from '@tanstack/react-db';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { exercisesCollection, workoutExercisesCollection, workoutsCollection } from '@/db/collections';
import { addWorkoutExercise, createWorkout } from '@/db/mutations';
import { FlashList } from '@/lib/list';
import { PrimaryButton, TextInput, Card } from '@/components/ui';
import { firstError } from '@/lib/formError';
import type { Tables } from '@/types/db';

type Workout = Tables<'workouts'>;
type WorkoutExercise = Tables<'workout_exercises'>;
type Exercise = Tables<'exercises'>;

interface ExerciseEntry {
  exerciseId: string;
  sets: string;
  reps: string;
  restSeconds: string;
}

const workoutSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  notes: z.string(),
  exercises: z.array(
    z.object({
      exerciseId: z.string().min(1, 'Select an exercise'),
      sets: z.string(),
      reps: z.string(),
      restSeconds: z.string(),
    }),
  ),
});


export default function WorkoutsScreen() {
  const { t } = useTranslation();
  const { data: workouts } = useLiveQuery(workoutsCollection);
  const { data: exercises } = useLiveQuery(exercisesCollection);
  const { data: workoutExercises } = useLiveQuery(workoutExercisesCollection);

  const [builderVisible, setBuilderVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const getExercisesForWorkout = (workoutId: string): WorkoutExercise[] =>
    [...((workoutExercises ?? []) as WorkoutExercise[])]
      .filter((we) => we.workout_id === workoutId)
      .sort((a, b) => a.position - b.position);

  const getExerciseName = (exerciseId: string): string =>
    ((exercises ?? []) as Exercise[]).find((e) => e.id === exerciseId)?.name ?? exerciseId;

  const form = useForm({
    defaultValues: {
      name: '',
      notes: '',
      exercises: [] as ExerciseEntry[],
    },
    validators: { onChange: workoutSchema },
    onSubmit: async ({ value }) => {
      setSaving(true);
      try {
        const workoutId = await createWorkout({
          name: value.name,
          notes: value.notes || null,
        });
        for (let i = 0; i < value.exercises.length; i++) {
          const ex = value.exercises[i];
          await addWorkoutExercise({
            workoutId,
            exerciseId: ex.exerciseId,
            position: i + 1,
            sets: parseInt(ex.sets, 10) || 3,
            reps: parseInt(ex.reps, 10) || 10,
            restSeconds: parseInt(ex.restSeconds, 10) || 60,
          });
        }
        setBuilderVisible(false);
        form.reset();
      } finally {
        setSaving(false);
      }
    },
  });

  const exerciseList = (exercises ?? []) as Exercise[];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-1">
        <View className="px-7 pt-4 pb-3 flex-row justify-between items-center">
          <Text className="text-white font-sans text-xl font-semibold">
            {t('coach.workouts.title', 'Workouts')}
          </Text>
          <TouchableOpacity
            onPress={() => setBuilderVisible(true)}
            className="bg-primary/20 border border-primary/40 rounded-lg px-3 py-2"
          >
            <Text className="text-primary font-sans text-sm font-medium">
              {t('coach.workouts.addBtn', '+ New')}
            </Text>
          </TouchableOpacity>
        </View>

        {(workouts ?? []).length === 0 ? (
          <View className="flex-1 items-center justify-center px-7">
            <Text className="text-text-secondary font-sans text-sm text-center">
              {t('coach.workouts.empty', 'No workouts yet. Tap + New to create one.')}
            </Text>
          </View>
        ) : (
          <FlashList
            data={(workouts ?? []) as Workout[]}

            contentContainerStyle={{ paddingHorizontal: 28, paddingBottom: 32 }}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const exList = getExercisesForWorkout(item.id);
              return (
                <Card className="mb-3">
                  <Text className="text-white font-sans font-medium mb-2">{item.name}</Text>
                  {exList.length === 0 ? (
                    <Text className="text-text-muted font-sans text-xs">
                      {t('coach.workouts.noExercises', 'No exercises')}
                    </Text>
                  ) : (
                    exList.map((we) => (
                      <View key={`${we.workout_id}:${we.position}`} className="flex-row justify-between py-0.5">
                        <Text className="text-text-secondary font-sans text-xs flex-1">
                          {we.position}. {getExerciseName(we.exercise_id)}
                        </Text>
                        <Text className="text-text-muted font-sans text-xs">
                          {we.sets}×{we.reps} · {we.rest_seconds}s
                        </Text>
                      </View>
                    ))
                  )}
                </Card>
              );
            }}
          />
        )}
      </View>

      {/* Workout Builder Modal */}
      <Modal
        visible={builderVisible}
        animationType="slide"
        onRequestClose={() => setBuilderVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
          >
            <View className="px-7 pt-4 pb-2 flex-row justify-between items-center">
              <Text className="text-white font-sans text-lg font-semibold">
                {t('coach.workouts.builderTitle', 'New Workout')}
              </Text>
              <TouchableOpacity onPress={() => { setBuilderVisible(false); form.reset(); }}>
                <Text className="text-text-secondary font-sans">✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-7" keyboardShouldPersistTaps="handled">
              <View className="gap-4 pb-6">
                <form.Field name="name">
                  {(f) => (
                    <TextInput
                      label={t('coach.workouts.form.name', 'Workout Name *')}
                      placeholder="e.g. Upper Body A"
                      value={f.state.value}
                      onChangeText={f.handleChange}
                      onBlur={f.handleBlur}
                      error={firstError(f.state.meta.errors)}
                    />
                  )}
                </form.Field>
                <form.Field name="notes">
                  {(f) => (
                    <TextInput
                      label={t('coach.workouts.form.notes', 'Notes')}
                      placeholder="Optional notes..."
                      multiline
                      numberOfLines={2}
                      value={f.state.value}
                      onChangeText={f.handleChange}
                      onBlur={f.handleBlur}
                    />
                  )}
                </form.Field>

                {/* Exercise field array */}
                <form.Field name="exercises">
                  {(field) => (
                    <View>
                      <View className="flex-row justify-between items-center mb-3">
                        <Text className="text-white font-sans font-medium">
                          {t('coach.workouts.form.exercises', 'Exercises')}
                        </Text>
                        <TouchableOpacity
                          onPress={() =>
                            field.pushValue({
                              exerciseId: '',
                              sets: '3',
                              reps: '10',
                              restSeconds: '60',
                            })
                          }
                          className="bg-primary/20 rounded-md px-2 py-1"
                        >
                          <Text className="text-primary font-sans text-sm">
                            {t('coach.workouts.form.addExercise', '+ Exercise')}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {field.state.value.length === 0 ? (
                        <Text className="text-text-muted font-sans text-sm text-center py-4">
                          {t('coach.workouts.form.noExercises', 'No exercises added yet')}
                        </Text>
                      ) : (
                        field.state.value.map((entry, index) => (
                          <Card key={index} className="mb-3">
                            <View className="flex-row justify-between items-center mb-2">
                              <Text className="text-text-secondary font-sans text-xs font-medium">
                                {t('coach.workouts.form.exerciseN', `Exercise ${index + 1}`)}
                              </Text>
                              <TouchableOpacity
                                onPress={() => field.removeValue(index)}
                                className="bg-red-500/20 rounded px-2 py-0.5"
                              >
                                <Text className="text-red-400 font-sans text-xs">
                                  {t('common.remove', 'Remove')}
                                </Text>
                              </TouchableOpacity>
                            </View>

                            {/* Exercise picker (select from list) */}
                            <form.Field name={`exercises[${index}].exerciseId`}>
                              {(f) => (
                                <View className="mb-2">
                                  <Text className="text-text-secondary font-sans text-xs mb-1">
                                    {t('coach.workouts.form.selectExercise', 'Exercise')}
                                  </Text>
                                  <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    className="flex-row"
                                  >
                                    {exerciseList.map((ex) => (
                                      <TouchableOpacity
                                        key={ex.id}
                                        onPress={() => f.handleChange(ex.id)}
                                        className={`mr-2 px-3 py-1.5 rounded-full border ${
                                          f.state.value === ex.id
                                            ? 'bg-primary border-primary'
                                            : 'border-surface'
                                        }`}
                                      >
                                        <Text
                                          className={`font-sans text-xs ${
                                            f.state.value === ex.id
                                              ? 'text-background'
                                              : 'text-text-secondary'
                                          }`}
                                        >
                                          {ex.name}
                                        </Text>
                                      </TouchableOpacity>
                                    ))}
                                  </ScrollView>
                                </View>
                              )}
                            </form.Field>

                            <View className="flex-row gap-2">
                              <form.Field name={`exercises[${index}].sets`}>
                                {(f) => (
                                  <View className="flex-1">
                                    <TextInput
                                      label={t('coach.workouts.form.sets', 'Sets')}
                                      keyboardType="number-pad"
                                      value={f.state.value}
                                      onChangeText={f.handleChange}
                                    />
                                  </View>
                                )}
                              </form.Field>
                              <form.Field name={`exercises[${index}].reps`}>
                                {(f) => (
                                  <View className="flex-1">
                                    <TextInput
                                      label={t('coach.workouts.form.reps', 'Reps')}
                                      keyboardType="number-pad"
                                      value={f.state.value}
                                      onChangeText={f.handleChange}
                                    />
                                  </View>
                                )}
                              </form.Field>
                              <form.Field name={`exercises[${index}].restSeconds`}>
                                {(f) => (
                                  <View className="flex-1">
                                    <TextInput
                                      label={t('coach.workouts.form.rest', 'Rest(s)')}
                                      keyboardType="number-pad"
                                      value={f.state.value}
                                      onChangeText={f.handleChange}
                                    />
                                  </View>
                                )}
                              </form.Field>
                            </View>
                          </Card>
                        ))
                      )}
                    </View>
                  )}
                </form.Field>

                <PrimaryButton
                  title={saving ? t('common.saving', 'Saving...') : t('common.save', 'Save Workout')}
                  loading={saving}
                  onPress={() => form.handleSubmit()}
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
