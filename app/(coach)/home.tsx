import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from '@tanstack/react-db';
import {
  coachClientsCollection,
  plansCollection,
  progressLogsCollection,
  profilesCollection,
  planAssignmentsCollection,
} from '@/db/collections';
import {
  StatCard,
  TrendChart,
  SectionHeader,
  EmptyState,
  Avatar,
  Badge,
} from '@/components/ui';
import { useSessionStore } from '@/stores/sessionStore';
import {
  activeClientCount,
  weeklyCompletionSeries,
  lastActivityAt,
} from '@/lib/coachStats';
import { startOfWeek, MS_PER_DAY } from '@/lib/dateWeeks';
import { colors } from '@/theme/tokens';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'muted';

function effortVariant(effort: number): BadgeVariant {
  if (effort >= 8) return 'success';
  if (effort >= 4) return 'muted';
  return 'warning';
}

export default function CoachHomeScreen() {
  const { t } = useTranslation();
  const profile = useSessionStore((s) => s.profile);

  const { data: coachClients } = useLiveQuery(coachClientsCollection);
  const { data: progressLogs } = useLiveQuery(progressLogsCollection);
  const { data: profiles } = useLiveQuery(profilesCollection);
  const { data: plans } = useLiveQuery(plansCollection);
  const { data: assignments } = useLiveQuery(planAssignmentsCollection);

  const clientList = coachClients ?? [];
  const logList = progressLogs ?? [];
  const profileList = profiles ?? [];
  const planList = plans ?? [];
  const assignmentList = assignments ?? [];

  const activeClients = activeClientCount(clientList);

  // active plans = plan_assignments with status 'active' whose plan is owned by this coach
  const coachPlanIds = new Set(
    planList
      .filter((p) => p.coach_id === profile?.id)
      .map((p) => p.id),
  );
  const activePlansCount = assignmentList.filter(
    (a) => a.status === 'active' && coachPlanIds.has(a.plan_id),
  ).length;

  // this-week completions
  const weekStart = startOfWeek(new Date());
  const weekEnd = weekStart.getTime() + 7 * MS_PER_DAY;
  const thisWeekCompletions = logList.filter((log) => {
    const ts = new Date(log.completed_at).getTime();
    return ts >= weekStart.getTime() && ts < weekEnd;
  }).length;

  const completionSeries = weeklyCompletionSeries(logList, 6);

  // recent activity: last 5 distinct client_ids by most recent log
  const sortedLogs = [...logList].sort(
    (a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime(),
  );
  const seenClientIds = new Set<string>();
  const recentClientIds: string[] = [];
  for (const log of sortedLogs) {
    if (!seenClientIds.has(log.client_id)) {
      seenClientIds.add(log.client_id);
      recentClientIds.push(log.client_id);
    }
    if (recentClientIds.length === 5) break;
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1" contentContainerClassName="pb-8">
        <View className="px-7 mt-4 mb-6">
          <Text className="text-text-secondary text-xs font-sans">
            {t('coach.home.welcome')}
          </Text>
          <Text className="text-white font-sans text-xl font-semibold">
            {profile?.full_name ?? ''}
          </Text>
        </View>

        <SectionHeader icon="stats-chart" title={t('coach.home.statsTitle')} className="px-4" />

        <View className="flex-row gap-3 px-4 mb-4">
          <StatCard
            icon="people"
            value={String(activeClients)}
            label={t('coach.home.activeClients')}
          />
          <StatCard
            icon="albums"
            value={String(activePlansCount)}
            label={t('coach.home.activePlans')}
          />
          <StatCard
            icon="checkmark-circle"
            value={String(thisWeekCompletions)}
            label={t('coach.home.weekCompletions')}
            iconColor={colors.success}
          />
        </View>

        <SectionHeader icon="trending-up" title={t('coach.home.weeklyTrend')} className="px-4" />
        <View className="mx-4 mb-4">
          <TrendChart data={completionSeries} emptyMessage={t('coach.home.noActivity')} />
        </View>

        <SectionHeader icon="time" title={t('coach.home.recentActivity')} className="px-4" />

        {recentClientIds.length === 0 ? (
          <EmptyState icon="time-outline" message={t('coach.home.noActivity')} />
        ) : (
          <View className="px-4">
            {recentClientIds.map((clientId) => {
              const clientProfile = profileList.find((p) => p.id === clientId);
              const lastLog = sortedLogs.find((l) => l.client_id === clientId);
              const effort = lastLog?.perceived_effort ?? null;
              const dateStr = lastActivityAt(clientId, logList);

              return (
                <View
                  key={clientId}
                  className="flex-row items-center gap-3 py-3 border-b border-border"
                >
                  <Avatar
                    uri={clientProfile?.avatar_url}
                    name={clientProfile?.full_name ?? '?'}
                    size="sm"
                  />
                  <View className="flex-1">
                    <Text className="text-white font-sans text-sm font-medium">
                      {clientProfile?.full_name ?? '?'}
                    </Text>
                    {dateStr ? (
                      <Text className="text-text-secondary font-sans text-xs">
                        {new Date(dateStr).toLocaleDateString()}
                      </Text>
                    ) : null}
                  </View>
                  {effort !== null ? (
                    <Badge
                      label={t('coach.home.effortLabel', { value: effort })}
                      variant={effortVariant(effort)}
                    />
                  ) : null}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
