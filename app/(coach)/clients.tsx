import { useState } from 'react';
import { View, Text, Modal, Share, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from '@tanstack/react-db';
import { coachClientsCollection, planAssignmentsCollection } from '@/db/collections';
import { removeClient } from '@/db/mutations';
import { useGenerateInvite } from '@/api';
import { FlashList } from '@/lib/list';
import { PrimaryButton, SecondaryButton, Card } from '@/components/ui';
import { useSessionStore } from '@/stores/sessionStore';
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

  const generateInvite = useGenerateInvite();
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientRowItem | null>(null);
  const [clientDetailVisible, setClientDetailVisible] = useState(false);

  const clients = allClients ?? [];

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
      t('coach.clients.removeConfirm', 'This will remove the client from your roster. Their history will be preserved.'),
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

  const getClientAssignment = (clientId: string) =>
    (assignments ?? []).find(
      (a) => a.client_id === clientId && (a.status === 'active' || a.status === 'paused'),
    );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-1">
        <View className="px-7 pt-4 pb-3 flex-row justify-between items-center">
          <Text className="text-white font-sans text-xl font-semibold">
            {t('coach.clients.title', 'Clients')}
          </Text>
          <TouchableOpacity
            onPress={handleGenerateInvite}
            disabled={generateInvite.isPending}
            className="bg-primary/20 border border-primary/40 rounded-lg px-3 py-2"
          >
            <Text className="text-primary font-sans text-sm font-medium">
              {generateInvite.isPending
                ? t('common.loading', '...')
                : t('coach.clients.inviteBtn', '+ Invite')}
            </Text>
          </TouchableOpacity>
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
              const assignment = getClientAssignment(item.client_id);
              return (
                <TouchableOpacity onPress={() => handleOpenClientDetail(item)}>
                  <Card className="mb-3">
                    <View className="flex-row justify-between items-center">
                      <View>
                        <Text className="text-white font-sans font-medium text-sm">
                          {item.client_id.slice(0, 8)}…
                        </Text>
                        <Text className="text-text-secondary font-sans text-xs mt-0.5">
                          {t('coach.clients.joined', 'Joined')}{' '}
                          {new Date(item.accepted_at).toLocaleDateString()}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text
                          className={`font-sans text-xs font-medium ${assignment ? 'text-green-400' : 'text-text-muted'}`}
                        >
                          {assignment
                            ? t('coach.clients.hasPlan', 'Has plan')
                            : t('coach.clients.noPlan', 'No plan')}
                        </Text>
                      </View>
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
            <PrimaryButton title={t('coach.clients.share', 'Share Code')} onPress={handleShare} className="mb-3" />
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
              <Text className="text-white font-sans text-lg font-semibold mb-4">
                {t('coach.clients.detailTitle', 'Client Detail')}
              </Text>
              {selectedClient && (
                <>
                  <View className="mb-4">
                    <Text className="text-text-secondary font-sans text-xs mb-1">
                      {t('coach.clients.clientId', 'Client ID')}
                    </Text>
                    <Text className="text-white font-sans text-sm">
                      {selectedClient.client_id}
                    </Text>
                  </View>
                  {getClientAssignment(selectedClient.client_id) ? (
                    <Card className="mb-4">
                      <Text className="text-green-400 font-sans text-sm font-medium">
                        {t('coach.clients.activePlan', '✓ Active plan assigned')}
                      </Text>
                    </Card>
                  ) : (
                    <Card className="mb-4">
                      <Text className="text-text-muted font-sans text-sm">
                        {t('coach.clients.noPlanAssigned', 'No plan assigned yet')}
                      </Text>
                    </Card>
                  )}
                  <SecondaryButton
                    title={t('coach.clients.remove', 'Remove Client')}
                    onPress={() => handleRemoveClient(selectedClient)}
                    className="mb-3"
                  />
                </>
              )}
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
