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
} from '@/db/collections';
import { Card } from '@/components/ui';
import { useSessionStore } from '@/stores/sessionStore';
import {
  currentWeekNumber,
  getWeekPlanDays,
  isPlanDayPast,
  isPlanDayToday,
} from '@/lib/planDay';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function TrainingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const profile = useSessionStore((s) => s.profile);

  const { data: assignments } = useLiveQuery(planAssignmentsCollection);
  const { data: planDays } = useLiveQuery(planDaysCollection);
  const { data: plans } = useLiveQuery(plansCollection);
  const { data: workouts } = useLiveQuery(workoutsCollection);

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
          <Text className="text-white font-sans text-xl font-semibold mb-2">
            {t('client.training.title')}
          </Text>
          <Card className="mt-4">
            <Text className="text-text-secondary font-sans text-sm text-center py-4">
              {t('client.training.noPlanMsg')}
            </Text>
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  const weekMap = getWeekPlanDays(activeAssignment, planDays ?? [], weekNum);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1" contentContainerClassName="px-7 pb-8">
        <View className="mt-4 mb-4">
          <Text className="text-white font-sans text-xl font-semibold">{activePlan.name}</Text>
          <Text className="text-text-secondary font-sans text-xs mt-1">
            {t('client.training.week')} {weekNum} / {totalWeeks}
          </Text>
        </View>

        {Array.from({ length: 7 }, (_, dow) => {
          const planDay = weekMap.get(dow);
          const workout = planDay?.workout_id
            ? (workouts ?? []).find((w) => w.id === planDay.workout_id)
            : null;
          const isToday = isPlanDayToday(activeAssignment, weekNum, dow);
          const isPast = isPlanDayPast(activeAssignment, weekNum, dow);

          return (
            <Card
              key={dow}
              className={`mb-3 ${isToday ? 'border border-primary' : ''}`}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text
                    className={`font-sans text-xs font-medium ${isToday ? 'text-primary' : 'text-text-secondary'}`}
                  >
                    {DAY_LABELS[dow]}
                    {isToday ? ' •' : ''}
                  </Text>
                  <Text className="text-white font-sans font-semibold mt-0.5">
                    {workout?.name ?? t('client.training.restDay')}
                  </Text>
                </View>

                {planDay && workout ? (
                  isToday ? (
                    <TouchableOpacity
                      className="bg-primary rounded-lg px-4 py-2"
                      onPress={() => router.push(`/(client)/workout/${planDay.id}` as never)}
                    >
                      <Text className="text-background font-sans font-semibold text-sm">
                        {t('client.training.startWorkout')}
                      </Text>
                    </TouchableOpacity>
                  ) : isPast ? (
                    <TouchableOpacity
                      className="border border-primary rounded-lg px-4 py-2"
                      onPress={() =>
                        router.push(
                          {
                            pathname: '/(client)/workout/[planDayId]',
                            params: { planDayId: planDay.id, retro: '1' },
                          } as never,
                        )
                      }
                    >
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
