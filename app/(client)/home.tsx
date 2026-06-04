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
} from '@/db/collections';
import { Card, PrimaryButton } from '@/components/ui';
import { useSessionStore } from '@/stores/sessionStore';
import { useWorkoutStore } from './workout/_store';
import { getTodaysPlanDay, isTodayInPlanRange } from '@/lib/planDay';

export default function ClientHomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const profile = useSessionStore((s) => s.profile);

  const { data: assignments } = useLiveQuery(planAssignmentsCollection);
  const { data: planDays } = useLiveQuery(planDaysCollection);
  const { data: plans } = useLiveQuery(plansCollection);
  const { data: workouts } = useLiveQuery(workoutsCollection);
  const { data: tips } = useLiveQuery(tipsCollection);

  const activePlanDayId = useWorkoutStore((s) => s.activePlanDayId);

  const activeAssignment = (assignments ?? []).find(
    (a) => a.client_id === profile?.id && (a.status === 'active' || a.status === 'paused'),
  );

  const activePlan = activeAssignment
    ? (plans ?? []).find((p) => p.id === activeAssignment.plan_id)
    : null;

  const todayPlanDay =
    activeAssignment && planDays
      ? getTodaysPlanDay(activeAssignment, planDays)
      : null;

  const inRange =
    activeAssignment && activePlan && activePlan.duration_weeks !== null
      ? isTodayInPlanRange(activeAssignment, activePlan.duration_weeks)
      : false;

  const todayWorkout =
    todayPlanDay?.workout_id
      ? (workouts ?? []).find((w) => w.id === todayPlanDay.workout_id)
      : null;

  const latestTips = [...(tips ?? [])]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  function renderTodayCard() {
    if (!activeAssignment) {
      return (
        <Card className="mb-4">
          <Text className="text-text-secondary font-sans text-sm text-center py-2">
            {t('client.home.noPlan')}
          </Text>
        </Card>
      );
    }
    if (activeAssignment.status === 'paused') {
      return (
        <Card className="mb-4">
          <Text className="text-text-secondary font-sans text-sm text-center py-2">
            {t('client.home.planPaused')}
          </Text>
        </Card>
      );
    }
    if (!inRange) {
      return (
        <Card className="mb-4">
          <Text className="text-text-secondary font-sans text-sm text-center py-2">
            {t('client.home.planCompleted')}
          </Text>
        </Card>
      );
    }
    if (!todayPlanDay || !todayWorkout) {
      return (
        <Card className="mb-4">
          <Text className="text-text-secondary font-sans text-sm text-center py-2">
            {t('client.home.noWorkoutToday')}
          </Text>
        </Card>
      );
    }
    return (
      <Card className="mb-4">
        <Text className="text-white font-sans font-semibold mb-1">{todayWorkout.name}</Text>
        {todayWorkout.notes ? (
          <Text className="text-text-secondary font-sans text-xs mb-3">{todayWorkout.notes}</Text>
        ) : null}
        <PrimaryButton
          title={t('client.home.startWorkout')}
          onPress={() => router.push(`/(client)/workout/${todayPlanDay.id}` as never)}
        />
      </Card>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1" contentContainerClassName="px-7 pb-8">
        <View className="flex-row justify-between items-center mt-4 mb-6">
          <View>
            <Text className="text-text-secondary text-xs font-sans">
              {t('client.home.welcome')}
            </Text>
            <Text className="text-white font-sans text-xl font-semibold">
              {profile?.full_name ?? ''}
            </Text>
          </View>
        </View>

        {activePlanDayId ? (
          <TouchableOpacity
            className="bg-primary rounded-card px-4 py-3 mb-4 flex-row items-center justify-between"
            onPress={() => router.push(`/(client)/workout/${activePlanDayId}` as never)}
          >
            <Text className="text-background font-sans font-semibold">
              {t('client.home.resumeWorkout')}
            </Text>
            <Text className="text-background">→</Text>
          </TouchableOpacity>
        ) : null}

        <Text className="text-white font-sans font-medium mb-3">
          {t('client.home.todayWorkout')}
        </Text>
        {renderTodayCard()}

        <Text className="text-white font-sans font-medium mb-3">
          {t('client.home.latestTips')}
        </Text>
        {latestTips.length === 0 ? (
          <Card>
            <Text className="text-text-secondary font-sans text-sm text-center py-2">
              {t('client.home.noTips')}
            </Text>
          </Card>
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
      </ScrollView>
    </SafeAreaView>
  );
}
