import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from '@tanstack/react-db';
import {
  coachClientsCollection,
  plansCollection,
  progressLogsCollection,
} from '@/db/collections';
import { Card } from '@/components/ui';
import { useSessionStore } from '@/stores/sessionStore';

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="flex-1 items-center py-5">
      <Text className="text-primary font-sans text-3xl font-bold">{value}</Text>
      <Text className="text-text-secondary font-sans text-xs mt-1 text-center">{label}</Text>
    </Card>
  );
}

export default function CoachHomeScreen() {
  const { t } = useTranslation();
  const profile = useSessionStore((s) => s.profile);

  const { data: clients } = useLiveQuery(coachClientsCollection);
  const { data: plans } = useLiveQuery(plansCollection);
  const { data: logs } = useLiveQuery(progressLogsCollection);

  const activeClients = (clients ?? []).filter((c) => c.status === 'active').length;
  const recentLogs = [...(logs ?? [])]
    .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
    .slice(0, 5);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1" contentContainerClassName="px-7 pt-4 pb-8">
        <View className="mb-6">
          <Text className="text-text-secondary text-xs font-sans">
            {t('coach.home.welcome', 'Welcome back')}
          </Text>
          <Text className="text-white font-sans text-xl font-semibold">
            {profile?.full_name ?? 'Coach'}
          </Text>
        </View>

        <View className="flex-row gap-3 mb-6">
          <StatCard label={t('coach.home.clients', 'Active Clients')} value={activeClients} />
          <StatCard label={t('coach.home.plans', 'Plans')} value={(plans ?? []).length} />
        </View>

        <Text className="text-white font-sans font-medium mb-3">
          {t('coach.home.recentActivity', 'Recent Activity')}
        </Text>
        {recentLogs.length === 0 ? (
          <Card>
            <Text className="text-text-secondary font-sans text-sm text-center py-4">
              {t('coach.home.noActivity', 'No workouts logged yet')}
            </Text>
          </Card>
        ) : (
          recentLogs.map((log) => (
            <Card key={log.id} className="mb-2">
              <View className="flex-row justify-between items-center">
                <Text className="text-white font-sans text-sm">
                  {t('coach.home.workoutLogged', 'Workout logged')}
                </Text>
                <Text className="text-text-secondary font-sans text-xs">
                  {new Date(log.completed_at).toLocaleDateString()}
                </Text>
              </View>
              {log.perceived_effort != null && (
                <Text className="text-text-secondary font-sans text-xs mt-1">
                  {t('coach.home.effort', 'Effort')}: {log.perceived_effort}/10
                </Text>
              )}
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
