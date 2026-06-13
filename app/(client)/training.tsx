import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useLiveQuery } from '@tanstack/react-db';
import {
  planAssignmentsCollection,
  planDaysCollection,
  plansCollection,
  workoutsCollection,
  progressLogsCollection,
} from '@/db/collections';
import {
  Card,
  Icon,
  EmptyState,
  SectionHeader,
  ProgressBar,
  type IconName,
} from '@/components/ui';
import { colors } from '@/theme/tokens';
import { useSessionStore } from '@/stores/sessionStore';
import {
  currentWeekNumber,
  getWeekPlanDays,
  isPlanDayPast,
  isPlanDayToday,
} from '@/lib/planDay';

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

export default function TrainingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const profile = useSessionStore((s) => s.profile);

  const { data: assignments } = useLiveQuery(planAssignmentsCollection);
  const { data: planDays } = useLiveQuery(planDaysCollection);
  const { data: plans } = useLiveQuery(plansCollection);
  const { data: workouts } = useLiveQuery(workoutsCollection);
  const { data: progressLogs } = useLiveQuery(progressLogsCollection);

  const activeAssignment = (assignments ?? []).find(
    (a) => a.client_id === profile?.id && (a.status === 'active' || a.status === 'paused'),
  );

  const activePlan = activeAssignment
    ? (plans ?? []).find((p) => p.id === activeAssignment.plan_id)
    : null;

  const weekNum = activeAssignment ? (currentWeekNumber(activeAssignment) ?? 1) : 1;
  const totalWeeks = activePlan?.duration_weeks ?? 0;

  if (!activeAssignment || !activePlan) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="flex-1 px-7 pt-4">
          <SectionHeader title={t('client.training.title')} icon="barbell" />
          <EmptyState icon="clipboard-outline" message={t('client.training.noPlanMsg')} />
        </View>
      </SafeAreaView>
    );
  }

  const weekMap = getWeekPlanDays(activeAssignment, planDays ?? [], weekNum);
  const weekProgress = totalWeeks > 0 ? (weekNum / totalWeeks) * 100 : 0;

  const doneDayIds = new Set((progressLogs ?? []).map((log) => log.plan_day_id));

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1" contentContainerClassName="px-7 pb-8">
        <View className="mt-4 mb-5">
          <SectionHeader title={activePlan.name} icon="barbell" className="mb-2" />
          <Text className="text-text-secondary font-sans text-xs mb-2">
            {t('client.training.week')} {weekNum} / {totalWeeks}
          </Text>
          <ProgressBar progress={weekProgress} showPercentage={false} />
        </View>

        {Array.from({ length: 7 }, (_, dow) => {
          const planDay = weekMap.get(dow);
          const workout = planDay?.workout_id
            ? (workouts ?? []).find((w) => w.id === planDay.workout_id)
            : null;
          const isToday = isPlanDayToday(activeAssignment, weekNum, dow);
          const isPast = isPlanDayPast(activeAssignment, weekNum, dow);
          const isDone = planDay ? doneDayIds.has(planDay.id) : false;

          const dayIcon: IconName = workout ? 'barbell' : 'bed-outline';
          const dayIconColor = isToday ? colors.primary : colors.textSecondary;

          return (
            <Card key={dow} className={`mb-3 ${isToday ? 'border border-primary' : ''}`}>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1 gap-3">
                  <Icon name={dayIcon} size={20} color={dayIconColor} />
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text
                        className={`font-sans text-xs font-medium ${isToday ? 'text-primary' : 'text-text-secondary'}`}
                      >
                        {t(`client.days.${DAY_KEYS[dow]}`)}
                      </Text>
                      {isToday ? (
                        <View className="bg-primary rounded-full px-2 py-0.5">
                          <Text className="text-background font-sans text-[10px] font-semibold">
                            {t('client.training.today')}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text className="text-white font-sans font-semibold mt-0.5">
                      {workout?.name ?? t('client.training.restDay')}
                    </Text>
                  </View>
                </View>

                {isDone ? (
                  <View className="flex-row items-center gap-1.5">
                    <Icon name="checkmark-circle" size={20} color={colors.success} />
                    <Text
                      className="font-sans text-sm font-semibold"
                      style={{ color: colors.success }}
                    >
                      {t('client.training.done')}
                    </Text>
                  </View>
                ) : planDay && workout ? (
                  isToday ? (
                    <TouchableOpacity
                      className="bg-primary rounded-button px-4 py-2 flex-row items-center gap-1.5"
                      activeOpacity={0.8}
                      onPress={() => router.push(`/(client)/workout/${planDay.id}` as never)}
                    >
                      <Icon name="play" size={16} color={colors.background} />
                      <Text className="text-background font-sans font-semibold text-sm">
                        {t('client.training.startWorkout')}
                      </Text>
                    </TouchableOpacity>
                  ) : isPast ? (
                    <TouchableOpacity
                      className="border border-primary rounded-button px-4 py-2 flex-row items-center gap-1.5"
                      activeOpacity={0.8}
                      onPress={() =>
                        router.push(
                          {
                            pathname: '/(client)/workout/[planDayId]',
                            params: { planDayId: planDay.id, retro: '1' },
                          } as never,
                        )
                      }
                    >
                      <Icon name="create-outline" size={16} color={colors.primary} />
                      <Text className="text-primary font-sans font-semibold text-sm">
                        {t('client.training.logRetro')}
                      </Text>
                    </TouchableOpacity>
                  ) : null
                ) : null}
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
