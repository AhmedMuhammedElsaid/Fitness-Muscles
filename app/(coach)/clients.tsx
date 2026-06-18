import { useState } from 'react';
import { View, Text, Modal, Share, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from '@tanstack/react-db';
import {
  coachClientsCollection,
  planAssignmentsCollection,
  plansCollection,
  planDaysCollection,
  progressLogsCollection,
  profilesCollection,
} from '@/db/collections';
import { removeClient } from '@/db/mutations';
import { useGenerateInvite } from '@/api';
import { FlashList } from '@/lib/list';
import {
  PrimaryButton,
  SecondaryButton,
  Card,
  Avatar,
  Badge,
  IconButton,
  ProgressRing,
} from '@/components/ui';
import { useSessionStore } from '@/stores/sessionStore';
import { lastActivityAt, clientAdherence } from '@/lib/coachStats';
import { eq } from '@tanstack/db';

interface ClientRowItem {
  coach_id: string;
  client_id: string;
  status: string;
  accepted_at: string;
}

export default function ClientsScreen() {
  const { t } = useTranslation();
  const profile = useSessionStore((s) => s.profile);
  const coachId = profile?.id ?? '';

  const { data: allClients } = useLiveQuery(
    (q) =>
      q
        .from({ c: coachClientsCollection })
        .where(({ c }) => eq(c.status, 'active'))
        .select(({ c }) => ({
          coach_id: c.coach_id,
          client_id: c.client_id,
          status: c.status,
          accepted_at: c.accepted_at,
        })),
    [coachId],
  );

  const { data: assignments } = useLiveQuery(planAssignmentsCollection);
  const { data: profiles } = useLiveQuery(profilesCollection);
  const { data: plans } = useLiveQuery(plansCollection);
  const { data: planDays } = useLiveQuery(planDaysCollection);
  const { data: progressLogs } = useLiveQuery(progressLogsCollection);

  const generateInvite = useGenerateInvite();
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientRowItem | null>(null);
  const [clientDetailVisible, setClientDetailVisible] = useState(false);

  const clients = allClients ?? [];
  const profileList = profiles ?? [];
  const planList = plans ?? [];
  const planDayList = planDays ?? [];
  const logList = progressLogs ?? [];

  const handleGenerateInvite = async () => {
    const code = await generateInvite.mutateAsync();
    setInviteCode(code);
    setInviteModalVisible(true);
  };

  const handleShare = async () => {
    if (!inviteCode) return;
    await Share.share({
      message: t('coach.clients.inviteShareText', `Join my coaching program! Use code: {{code}}`, {
        code: inviteCode,
      }),
    });
  };

  const handleOpenClientDetail = (client: ClientRowItem) => {
    setSelectedClient(client);
    setClientDetailVisible(true);
  };

  const handleRemoveClient = (client: ClientRowItem) => {
    Alert.alert(
      t('coach.clients.removeTitle', 'Remove Client'),
      t(
        'coach.clients.removeConfirm',
        'This will remove the client from your roster. Their history will be preserved.',
      ),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('coach.clients.remove', 'Remove'),
          style: 'destructive',
          onPress: async () => {
            try {
              await removeClient(client.coach_id, client.client_id);
              setClientDetailVisible(false);
            } catch {
              // toast already fired in mutation
            }
          },
        },
      ],
    );
  };

  const getClientProfile = (clientId: string) => profileList.find((p) => p.id === clientId);

  const getClientAssignment = (clientId: string) =>
    (assignments ?? []).find(
      (a) => a.client_id === clientId && (a.status === 'active' || a.status === 'paused'),
    );

  const getPlanName = (planId: string) => planList.find((p) => p.id === planId)?.name ?? null;

  const clientName = (clientId: string) =>
    getClientProfile(clientId)?.full_name ?? t('coach.clients.unknownClient', 'Unknown client');

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-1">
        <View className="px-7 pt-4 pb-3 flex-row justify-between items-center">
          <Text className="text-white font-sans text-xl font-semibold">
            {t('coach.clients.title', 'Clients')}
          </Text>
          <IconButton
            name="person-add"
            onPress={handleGenerateInvite}
            disabled={generateInvite.isPending}
            accessibilityLabel={t('coach.clients.inviteBtn', '+ Invite')}
            variant="default"
          />
        </View>

        {clients.length === 0 ? (
          <View className="flex-1 items-center justify-center px-7">
            <Text className="text-text-secondary font-sans text-sm text-center">
              {t('coach.clients.empty', 'No clients yet. Generate an invite code to get started.')}
            </Text>
          </View>
        ) : (
          <FlashList
            data={clients}
            contentContainerStyle={{ paddingHorizontal: 28, paddingBottom: 32 }}
            keyExtractor={(item) => item.client_id}
            renderItem={({ item }) => {
              const clientProfile = getClientProfile(item.client_id);
              const assignment = getClientAssignment(item.client_id);
              const lastActive = lastActivityAt(item.client_id, logList);
              return (
                <TouchableOpacity onPress={() => handleOpenClientDetail(item)}>
                  <Card className="mb-3">
                    <View className="flex-row items-center gap-3">
                      <Avatar
                        uri={clientProfile?.avatar_url}
                        name={clientName(item.client_id)}
                        size="md"
                      />
                      <View className="flex-1">
                        <Text className="text-white font-sans font-medium text-sm">
                          {clientName(item.client_id)}
                        </Text>
                        <Text className="text-text-secondary font-sans text-xs mt-0.5">
                          {lastActive
                            ? t('coach.clients.lastActive', 'Last active {{date}}', {
                                date: new Date(lastActive).toLocaleDateString(),
                              })
                            : t('coach.clients.neverActive', 'No activity yet')}
                        </Text>
                      </View>
                      <Badge
                        label={
                          assignment
                            ? t('coach.clients.hasPlan', 'Has plan')
                            : t('coach.clients.noPlan', 'No plan')
                        }
                        variant={assignment ? 'success' : 'muted'}
                      />
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>

      {/* Invite code modal */}
      <Modal
        visible={inviteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInviteModalVisible(false)}
      >
        <View className="flex-1 bg-black/60 items-center justify-center px-7">
          <View className="bg-surface rounded-2xl p-6 w-full">
            <Text className="text-white font-sans text-lg font-semibold text-center mb-2">
              {t('coach.clients.inviteCode', 'Invite Code')}
            </Text>
            <Text className="text-primary font-serif text-4xl italic text-center mb-6 tracking-widest">
              {inviteCode}
            </Text>
            <Text className="text-text-secondary font-sans text-xs text-center mb-6">
              {t('coach.clients.inviteExpiry', 'Valid for 7 days, single use')}
            </Text>
            <PrimaryButton
              title={t('coach.clients.share', 'Share Code')}
              onPress={handleShare}
              className="mb-3"
            />
            <SecondaryButton
              title={t('common.done', 'Done')}
              onPress={() => setInviteModalVisible(false)}
            />
          </View>
        </View>
      </Modal>

      {/* Client detail modal */}
      <Modal
        visible={clientDetailVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setClientDetailVisible(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <SafeAreaView className="bg-surface rounded-t-2xl" edges={['bottom']}>
            <View className="p-6">
              {selectedClient &&
                (() => {
                  const detailProfile = getClientProfile(selectedClient.client_id);
                  const assignment = getClientAssignment(selectedClient.client_id);
                  const planName = assignment ? getPlanName(assignment.plan_id) : null;
                  const adherence = assignment
                    ? clientAdherence(assignment, planDayList, logList)
                    : 0;
                  return (
                    <>
                      <View className="flex-row items-center gap-3 mb-6">
                        <Avatar
                          uri={detailProfile?.avatar_url}
                          name={clientName(selectedClient.client_id)}
                          size="lg"
                        />
                        <View className="flex-1">
                          <Text className="text-white font-sans text-lg font-semibold">
                            {clientName(selectedClient.client_id)}
                          </Text>
                          <Text className="text-text-secondary font-sans text-xs mt-1">
                            {t('coach.clients.joined', 'Joined')}{' '}
                            {new Date(selectedClient.accepted_at).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>

                      {assignment ? (
                        <View className="flex-row items-center gap-4 mb-6">
                          <ProgressRing progress={adherence} size={72}>
                            <Text className="text-white font-sans text-base font-semibold">
                              {adherence}%
                            </Text>
                          </ProgressRing>
                          <View className="flex-1">
                            <Text className="text-text-secondary font-sans text-xs mb-0.5">
                              {t('coach.clients.assignedPlan', 'Assigned plan')}
                            </Text>
                            <Text className="text-white font-sans text-sm font-medium">
                              {planName ?? t('coach.clients.activePlan', 'Active plan assigned')}
                            </Text>
                            <Text className="text-text-secondary font-sans text-xs mt-2">
                              {t('coach.clients.adherence', 'Adherence')}
                            </Text>
                          </View>
                        </View>
                      ) : (
                        <Card className="mb-6">
                          <Text className="text-text-muted font-sans text-sm">
                            {t('coach.clients.noPlanAssigned', 'No plan assigned yet')}
                          </Text>
                        </Card>
                      )}

                      <TouchableOpacity
                        onPress={() => handleRemoveClient(selectedClient)}
                        activeOpacity={0.8}
                        className="border border-danger rounded-button py-4 items-center justify-center mb-3"
                      >
                        <Text className="text-danger font-sans font-semibold text-base">
                          {t('coach.clients.remove', 'Remove Client')}
                        </Text>
                      </TouchableOpacity>
                    </>
                  );
                })()}
              <TouchableOpacity onPress={() => setClientDetailVisible(false)} className="py-3">
                <Text className="text-text-secondary font-sans text-sm text-center">
                  {t('common.close', 'Close')}
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
