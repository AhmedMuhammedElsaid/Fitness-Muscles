import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { WebView } from 'react-native-webview';
import * as Haptics from 'expo-haptics';
import { useLiveQuery } from '@tanstack/react-db';
import {
  exercisesCollection,
  planAssignmentsCollection,
  planDaysCollection,
  workoutExercisesCollection,
} from '@/db/collections';
import { logProgress } from '@/db/mutations';
import { Icon, ProgressRing } from '@/components/ui';
import { colors } from '@/theme/tokens';
import { useSessionStore } from '@/stores/sessionStore';
import { extractVideoId, toEmbedUrl } from '@/lib/youtube';
import {
  addSet,
  clearWorkout,
  startWorkout,
  upsertSet,
  useWorkoutStore,
} from './_store';
import type { Tables } from '@/types/db';

type WorkoutExercise = Tables<'workout_exercises'>;
type Exercise = Tables<'exercises'>;

// ─── Rest Timer ───────────────────────────────────────────────────────────────

function RestTimer({ seconds, onDone }: { seconds: number; onDone: () => void }) {
  const { t } = useTranslation();
  const [remaining, setRemaining] = useState(seconds);
  const [total, setTotal] = useState(seconds);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    ref.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(ref.current!);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onDone();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current!);
  }, [onDone]);

  const progress = total > 0 ? (remaining / total) * 100 : 0;

  return (
    <View className="bg-surface-elevated rounded-card p-4 mb-4 items-center">
      <Text className="text-text-secondary font-sans text-xs mb-3">
        {t('client.workout.restTimer')}
      </Text>
      <ProgressRing progress={progress} size={120} strokeWidth={10} color={colors.primary}>
        <Text className="text-primary font-sans text-4xl font-bold">{remaining}</Text>
        <Text className="text-text-muted font-sans text-xs">s</Text>
      </ProgressRing>
      <View className="flex-row gap-3 mt-4">
        <TouchableOpacity
          className="flex-row items-center gap-1.5 border border-primary rounded-lg px-4 py-2"
          onPress={() => {
            setRemaining((r) => r + 15);
            setTotal((tt) => tt + 15);
          }}
        >
          <Icon name="add" size={16} color={colors.primary} />
          <Text className="text-primary font-sans text-sm">{t('client.workout.extend')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-row items-center gap-1.5 bg-surface rounded-lg px-4 py-2"
          onPress={onDone}
        >
          <Icon name="play-skip-forward" size={16} color={colors.textSecondary} />
          <Text className="text-text-secondary font-sans text-sm">{t('client.workout.skip')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Set Row ──────────────────────────────────────────────────────────────────

function SetRow({
  exerciseId,
  setNumber,
  prescribedReps,
  onComplete,
}: {
  exerciseId: string;
  setNumber: number;
  prescribedReps: number;
  onComplete: () => void;
}) {
  const { t } = useTranslation();
  const entry = useWorkoutStore(
    (s) => s.sets[exerciseId]?.find((e) => e.setNumber === setNumber) ?? null,
  );
  const [reps, setReps] = useState(String(prescribedReps));
  const [weight, setWeight] = useState('');
  const done = entry !== null;

  function handleCheck() {
    if (done) return;
    upsertSet(exerciseId, {
      setNumber,
      repsDone: parseInt(reps, 10) || null,
      weightDone: parseFloat(weight) || null,
    });
    onComplete();
  }

  return (
    <View className={`flex-row items-center gap-3 py-2 ${done ? 'opacity-60' : ''}`}>
      <Text className="text-text-secondary font-sans text-xs w-6 text-center">{setNumber}</Text>
      <TextInput
        className="flex-1 bg-surface rounded-lg px-3 py-2 text-white font-sans text-sm"
        value={reps}
        onChangeText={setReps}
        keyboardType="number-pad"
        placeholder={t('client.workout.repsLabel')}
        placeholderTextColor="#666"
        editable={!done}
      />
      <TextInput
        className="flex-1 bg-surface rounded-lg px-3 py-2 text-white font-sans text-sm"
        value={weight}
        onChangeText={setWeight}
        keyboardType="decimal-pad"
        placeholder={t('client.workout.weightLabel')}
        placeholderTextColor="#666"
        editable={!done}
      />
      <TouchableOpacity
        className={`w-8 h-8 rounded-full border-2 items-center justify-center ${done ? 'bg-primary border-primary' : 'border-text-muted'}`}
        onPress={handleCheck}
        disabled={done}
      >
        {done ? <Icon name="checkmark" size={16} color={colors.background} /> : null}
      </TouchableOpacity>
    </View>
  );
}

// ─── Exercise Card ────────────────────────────────────────────────────────────

function ExerciseCard({
  we,
  exercise,
  onSetComplete,
}: {
  we: WorkoutExercise;
  exercise: Exercise | undefined;
  onSetComplete: (restSeconds: number) => void;
}) {
  const { t } = useTranslation();
  const loggedSets = useWorkoutStore((s) => s.sets[we.exercise_id] ?? []);
  const setCount = Math.max(we.sets ?? 3, loggedSets.length);
  const videoId = exercise?.video_url ? extractVideoId(exercise.video_url) : null;
  const [showVideo, setShowVideo] = useState(false);

  return (
    <View className="mb-6">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-white font-sans font-semibold flex-1">
          {exercise?.name ?? ''}
        </Text>
        <Text className="text-text-muted font-sans text-xs">
          {we.sets ?? 3} {t('client.workout.sets')} × {we.reps ?? 10} {t('client.workout.reps')}
        </Text>
      </View>

      {videoId ? (
        showVideo ? (
          <View className="mb-3">
            <TouchableOpacity
              className="flex-row items-center justify-center gap-1.5 py-2"
              onPress={() => setShowVideo(false)}
            >
              <Icon name="chevron-up" size={16} color={colors.primary} />
              <Text className="text-primary font-sans text-sm">{t('client.workout.hideVideo')}</Text>
            </TouchableOpacity>
            <View className="rounded-card overflow-hidden" style={{ height: 180 }}>
              <WebView
                source={{ uri: toEmbedUrl(videoId) }}
                allowsFullscreenVideo
                mediaPlaybackRequiresUserAction={false}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        ) : (
          <TouchableOpacity
            className="flex-row items-center justify-center gap-2 bg-surface rounded-card py-3 mb-3"
            onPress={() => setShowVideo(true)}
          >
            <Icon name="play-circle" size={18} color={colors.primary} />
            <Text className="text-primary font-sans text-sm">{t('client.workout.showVideo')}</Text>
          </TouchableOpacity>
        )
      ) : null}

      {Array.from({ length: setCount }, (_, i) => (
        <SetRow
          key={i}
          exerciseId={we.exercise_id}
          setNumber={i + 1}
          prescribedReps={we.reps ?? 10}
          onComplete={() => onSetComplete(we.rest_seconds ?? 60)}
        />
      ))}

      <TouchableOpacity
        className="mt-2"
        onPress={() => addSet(we.exercise_id)}
      >
        <Text className="text-primary font-sans text-sm">{t('client.workout.addSet')}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Finish Sheet ─────────────────────────────────────────────────────────────

function FinishSheet({
  onFinish,
  onCancel,
}: {
  onFinish: (effort: number | null, notes: string) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [effort, setEffort] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  return (
    <View className="bg-surface rounded-t-3xl p-6">
      <Text className="text-white font-sans text-lg font-semibold mb-4">
        {t('client.workout.finishTitle')}
      </Text>

      <Text className="text-text-secondary font-sans text-xs mb-2">
        {t('client.workout.effortLabel')}
      </Text>
      <View className="flex-row gap-2 mb-4 flex-wrap">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <TouchableOpacity
            key={n}
            className={`w-9 h-9 rounded-full items-center justify-center ${effort === n ? 'bg-primary' : 'bg-surface-elevated'}`}
            onPress={() => setEffort(n)}
          >
            <Text className={`font-sans text-sm ${effort === n ? 'text-background' : 'text-white'}`}>
              {n}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text className="text-text-secondary font-sans text-xs mb-2">
        {t('client.workout.notesLabel')}
      </Text>
      <TextInput
        className="bg-surface-elevated rounded-card px-4 py-3 text-white font-sans text-sm mb-6"
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
        placeholderTextColor="#666"
        placeholder={t('client.workout.notesLabel')}
      />

      <TouchableOpacity
        className="bg-primary rounded-button py-4 flex-row items-center justify-center gap-2 mb-3"
        activeOpacity={0.85}
        onPress={() => onFinish(effort, notes)}
      >
        <Icon name="checkmark-done" size={18} color={colors.background} />
        <Text className="text-background font-sans font-semibold">{t('client.workout.finish')}</Text>
      </TouchableOpacity>

      <TouchableOpacity className="items-center" onPress={onCancel}>
        <Text className="text-text-secondary font-sans text-sm">{t('common.cancel')}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function WorkoutScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { planDayId, retro } = useLocalSearchParams<{ planDayId: string; retro?: string }>();
  const profile = useSessionStore((s) => s.profile);

  const { data: planDays } = useLiveQuery(planDaysCollection);
  const { data: assignments } = useLiveQuery(planAssignmentsCollection);
  const { data: weRows } = useLiveQuery(workoutExercisesCollection);
  const { data: exercises } = useLiveQuery(exercisesCollection);

  const planDay = (planDays ?? []).find((pd) => pd.id === planDayId);
  const assignment = (assignments ?? []).find(
    (a) => a.client_id === profile?.id && (a.status === 'active' || a.status === 'paused'),
  );

  const workoutExercises = (weRows ?? [])
    .filter((we) => we.workout_id === planDay?.workout_id)
    .sort((a, b) => a.position - b.position);

  const [restTimer, setRestTimer] = useState<{ seconds: number } | null>(null);
  const [showFinish, setShowFinish] = useState(false);
  const [saving, setSaving] = useState(false);

  const activePlanDayId = useWorkoutStore((s) => s.activePlanDayId);
  const sets = useWorkoutStore((s) => s.sets);

  useEffect(() => {
    if (planDayId && assignment && activePlanDayId !== planDayId) {
      startWorkout(planDayId, assignment.id);
    }
  }, [planDayId, assignment, activePlanDayId]);

  async function handleFinish(effort: number | null, notes: string) {
    if (!assignment || !planDay) return;
    setSaving(true);
    try {
      const setEntries = Object.entries(sets).flatMap(([exerciseId, logs]) =>
        logs.map((l) => ({
          exerciseId,
          setNumber: l.setNumber,
          repsDone: l.repsDone,
          weightDone: l.weightDone,
        })),
      );
      await logProgress({
        assignmentId: assignment.id,
        planDayId,
        perceivedEffort: effort,
        notes: notes || null,
        completedAt: retro ? undefined : new Date().toISOString(),
        sets: setEntries,
      });
      clearWorkout();
      router.back();
    } finally {
      setSaving(false);
    }
  }

  function handleDiscard() {
    Alert.alert(
      t('client.workout.discard'),
      t('client.workout.discardConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('client.workout.discard'),
          style: 'destructive',
          onPress: () => {
            clearWorkout();
            router.back();
          },
        },
      ],
    );
  }

  if (!planDay || !assignment) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#E8DEB5" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-7 pt-4 pb-3">
        <TouchableOpacity className="flex-row items-center gap-1.5" onPress={handleDiscard}>
          <Icon name="trash-outline" size={16} color={colors.textSecondary} />
          <Text className="text-text-secondary font-sans text-sm">{t('client.workout.discard')}</Text>
        </TouchableOpacity>
        <Text className="text-white font-sans font-semibold">{t('client.workout.title')}</Text>
        <TouchableOpacity className="flex-row items-center gap-1.5" onPress={() => setShowFinish(true)}>
          <Icon name="checkmark-done" size={16} color={colors.primary} />
          <Text className="text-primary font-sans font-semibold">{t('client.workout.finish')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-7" contentContainerClassName="pb-8">
        {restTimer ? (
          <RestTimer
            seconds={restTimer.seconds}
            onDone={() => setRestTimer(null)}
          />
        ) : null}

        {workoutExercises.map((we) => {
          const exercise = (exercises ?? []).find((e) => e.id === we.exercise_id);
          return (
            <ExerciseCard
              key={`${we.workout_id}:${we.position}`}
              we={we}
              exercise={exercise}
              onSetComplete={(restSeconds) => setRestTimer({ seconds: restSeconds })}
            />
          );
        })}
      </ScrollView>

      {showFinish ? (
        <View className="absolute inset-x-0 bottom-0">
          <FinishSheet
            onFinish={async (effort, notes) => {
              setShowFinish(false);
              await handleFinish(effort, notes);
            }}
            onCancel={() => setShowFinish(false)}
          />
          {saving ? (
            <View className="absolute inset-0 bg-background/70 items-center justify-center">
              <ActivityIndicator color="#E8DEB5" />
            </View>
          ) : null}
        </View>
      ) : null}
    </SafeAreaView>
  );
}
