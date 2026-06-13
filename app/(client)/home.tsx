import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useLiveQuery } from '@tanstack/react-db';
import {
  planAssignmentsCollection,
  planDaysCollection,
  plansCollection,
  tipsCollection,
  workoutsCollection,
  progressLogsCollection,
  setLogsCollection,
  workoutExercisesCollection,
} from '@/db/collections';
import {
  Card,
  PrimaryButton,
  Icon,
  StatCard,
  ProgressBar,
  TrendChart,
  SectionHeader,
  EmptyState,
  StreakBadge,
} from '@/components/ui';
import { useSessionStore } from '@/stores/sessionStore';
import { useWorkoutStore } from './workout/_store';
import { getTodaysPlanDay, isTodayInPlanRange, currentWeekNumber } from '@/lib/planDay';
import {
  currentStreak,
  avgEffort,
  workoutsCompleted,
  planProgressPct,
  weeklyVolumeSeries,
} from '@/lib/progressStats';
import { colors } from '@/theme/tokens';

function fmt(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(Math.round(n));
}

export default function ClientHomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const profile = useSessionStore((s) => s.profile);

  const { data: assignments } = useLiveQuery(planAssignmentsCollection);
  const { data: planDays } = useLiveQuery(planDaysCollection);
  const { data: plans } = useLiveQuery(plansCollection);
  const { data: workouts } = useLiveQuery(workoutsCollection);
  const { data: tips } = useLiveQuery(tipsCollection);
  const { data: progressLogs } = useLiveQuery(progressLogsCollection);
  const { data: setLogs } = useLiveQuery(setLogsCollection);
  const { data: workoutExercises } = useLiveQuery(workoutExercisesCollection);

  const activePlanDayId = useWorkoutStore((s) => s.activePlanDayId);

  const activeAssignment = (assignments ?? []).find(
    (a) => a.client_id === profile?.id && (a.status === 'active' || a.status === 'paused'),
  );

  const activePlan = activeAssignment
    ? (plans ?? []).find((p) => p.id === activeAssignment.plan_id)
    : null;

  const todayPlanDay =
    activeAssignment && planDays ? getTodaysPlanDay(activeAssignment, planDays) : null;

  const inRange =
    activeAssignment && activePlan && activePlan.duration_weeks !== null
      ? isTodayInPlanRange(activeAssignment, activePlan.duration_weeks)
      : false;

  const todayWorkout = todayPlanDay?.workout_id
    ? (workouts ?? []).find((w) => w.id === todayPlanDay.workout_id)
    : null;

  const latestTips = [...(tips ?? [])]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  const streak = activeAssignment
    ? currentStreak(activeAssignment, planDays ?? [], progressLogs ?? [])
    : 0;

  const volumeSeries = weeklyVolumeSeries(progressLogs ?? [], setLogs ?? [], 6);
  const currentVolume = volumeSeries.length > 0 ? volumeSeries[volumeSeries.length - 1].value : 0;
  const effort = avgEffort(progressLogs ?? []);
  const completed = activeAssignment ? workoutsCompleted(activeAssignment, progressLogs ?? []) : 0;

  function renderTodayCard() {
    if (!activeAssignment) {
      return <EmptyState icon="clipboard-outline" message={t('client.home.noPlan')} />;
    }
    if (activeAssignment.status === 'paused') {
      return <EmptyState icon="pause-circle-outline" message={t('client.home.planPaused')} />;
    }
    if (!inRange) {
      return <EmptyState icon="trophy-outline" message={t('client.home.planCompleted')} />;
    }
    if (!todayPlanDay || !todayWorkout) {
      return <EmptyState icon="bed-outline" message={t('client.home.noWorkoutToday')} />;
    }

    const exerciseCount = (workoutExercises ?? []).filter(
      (we) => we.workout_id === todayWorkout.id,
    ).length;

    return (
      <Card className="mb-4">
        <View className="flex-row items-center gap-2 mb-1">
          <Icon name="play-circle" size={20} color={colors.primary} />
          <Text className="text-white font-sans font-semibold flex-1">{todayWorkout.name}</Text>
        </View>
        <Text className="text-text-secondary font-sans text-xs mb-1">
          {t('client.home.exerciseCount', { count: exerciseCount })}
        </Text>
        {todayWorkout.notes ? (
          <Text className="text-text-secondary font-sans text-xs mb-3">{todayWorkout.notes}</Text>
        ) : (
          <View className="mb-3" />
        )}
        <PrimaryButton
          title={t('client.home.startWorkout')}
          onPress={() => router.push(`/(client)/workout/${todayPlanDay.id}` as never)}
        />
      </Card>
    );
  }

  const weekNum = activeAssignment ? currentWeekNumber(activeAssignment) : null;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1" contentContainerClassName="px-7 pb-8">
        <View className="flex-row justify-between items-center mt-4 mb-6">
          <View className="flex-1 pr-3">
            <Text className="text-text-secondary text-xs font-sans">
              {t('client.home.welcome')}
            </Text>
            <Text className="text-white font-sans text-xl font-semibold">
              {profile?.full_name ?? ''}
            </Text>
          </View>
          <StreakBadge days={streak} label={t('client.home.streakUnit')} />
        </View>

        {activePlanDayId ? (
          <TouchableOpacity
            className="bg-primary rounded-card px-4 py-3 mb-4 flex-row items-center justify-between"
            onPress={() => router.push(`/(client)/workout/${activePlanDayId}` as never)}
          >
            <Text className="text-background font-sans font-semibold">
              {t('client.home.resumeWorkout')}
            </Text>
            <Icon name="arrow-forward" size={18} color={colors.background} flipRTL />
          </TouchableOpacity>
        ) : null}

        <SectionHeader title={t('client.home.todayWorkout')} icon="barbell" />
        {renderTodayCard()}

        {activeAssignment && activePlan ? (
          <>
            <SectionHeader title={t('client.home.planProgress')} icon="calendar" />
            <Text className="text-text-secondary font-sans text-xs mb-2">
              {t('client.home.weekOf', {
                current: weekNum ?? 0,
                total: activePlan.duration_weeks ?? 0,
              })}
            </Text>
            <ProgressBar
              progress={planProgressPct(weekNum, activePlan.duration_weeks ?? 0)}
              showPercentage
            />

            <View className="flex-row gap-3 mt-5 mb-2">
              <StatCard
                icon="barbell"
                value={fmt(currentVolume)}
                label={t('client.home.statVolume')}
              />
              <StatCard
                icon="flash"
                value={effort > 0 ? String(effort) : '—'}
                label={t('client.home.statEffort')}
              />
              <StatCard
                icon="checkmark-circle"
                value={String(completed)}
                label={t('client.home.statWorkouts')}
                iconColor={colors.success}
              />
            </View>

            <View className="mt-4">
              <SectionHeader title={t('client.home.volumeTrend')} icon="trending-up" />
              <TrendChart data={volumeSeries} emptyMessage={t('client.home.trendEmpty')} />
            </View>
          </>
        ) : null}

        <View className="mt-6">
          <SectionHeader
            title={t('client.home.tipsTitle')}
            icon="bulb"
            actionLabel={t('client.home.seeAll')}
            onAction={() => router.push('/(client)/chat' as never)}
          />
          {latestTips.length === 0 ? (
            <EmptyState icon="bulb-outline" message={t('client.home.noTips')} />
          ) : (
            latestTips.map((tip) => (
              <Card key={tip.id} className="mb-3">
                <Text className="text-white font-sans text-sm">{tip.body}</Text>
                <Text className="text-text-muted font-sans text-xs mt-2">
                  {new Date(tip.created_at).toLocaleDateString()}
                </Text>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
