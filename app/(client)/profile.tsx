import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useLiveQuery } from '@tanstack/react-db';
import { I18nManager } from 'react-native';
import { supabase } from '@/config/supabase';
import { useSessionStore } from '@/stores/sessionStore';
import { useUploadAvatar } from '@/api';
import { planAssignmentsCollection, plansCollection } from '@/db/collections';
import {
  PrimaryButton,
  SecondaryButton,
  TextInput,
  Card,
  Icon,
  SectionHeader,
  EmptyState,
} from '@/components/ui';
import { firstError } from '@/lib/formError';
import i18n from '@/lib/i18n';
import { colors } from '@/theme/tokens';

const profileSchema = z.object({
  fullName: z.string().min(1, 'Name is required'),
});

export default function ClientProfileScreen() {
  const { t } = useTranslation();
  const profile = useSessionStore((s) => s.profile);
  const [saving, setSaving] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const uploadAvatar = useUploadAvatar();

  const { data: assignments } = useLiveQuery(planAssignmentsCollection);
  const { data: plans } = useLiveQuery(plansCollection);

  const myAssignments = (assignments ?? [])
    .filter((a) => a.client_id === profile?.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const activeAssignment = myAssignments.find(
    (a) => a.status === 'active' || a.status === 'paused',
  );
  const activePlanName = activeAssignment
    ? ((plans ?? []).find((p) => p.id === activeAssignment.plan_id)?.name ?? null)
    : null;

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(i18n.language, {
        year: 'numeric',
        month: 'long',
      })
    : null;

  const form = useForm({
    defaultValues: { fullName: profile?.full_name ?? '' },
    validators: { onChange: profileSchema },
    onSubmit: async ({ value }) => {
      if (!profile) return;
      setSaving(true);
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ full_name: value.fullName })
          .eq('id', profile.id);
        if (error) throw error;
      } finally {
        setSaving(false);
      }
    },
  });

  const handlePickAvatar = async () => {
    if (!profile) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    setAvatarSaving(true);
    try {
      await uploadAvatar.mutateAsync({ userId: profile.id, uri: result.assets[0].uri });
    } finally {
      setAvatarSaving(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      t('client.profile.signOutTitle'),
      t('client.profile.signOutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.signOut'),
          style: 'destructive',
          onPress: () => void supabase.auth.signOut(),
        },
      ],
    );
  };

  const handleToggleLanguage = () => {
    const nextLang = i18n.language === 'ar' ? 'en' : 'ar';
    void i18n.changeLanguage(nextLang);
    const shouldBeRTL = nextLang === 'ar';
    if (I18nManager.isRTL !== shouldBeRTL) {
      I18nManager.allowRTL(shouldBeRTL);
      I18nManager.forceRTL(shouldBeRTL);
      Alert.alert(t('client.profile.rtlTitle'), t('client.profile.rtlRestart'));
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1" contentContainerClassName="px-7 pt-4 pb-10">
        <Text className="text-white font-sans text-xl font-semibold mb-6">
          {t('client.profile.title')}
        </Text>

        {/* Header summary */}
        <Card className="mb-6">
          <View className="flex-row items-center gap-4">
            <TouchableOpacity onPress={handlePickAvatar} disabled={avatarSaving}>
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={{ width: 80, height: 80, borderRadius: 40 }}
                  contentFit="cover"
                />
              ) : (
                <View className="w-20 h-20 rounded-full bg-surface items-center justify-center">
                  <Icon name="person-circle-outline" size={48} color={colors.textSecondary} />
                </View>
              )}
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-white font-sans text-lg font-semibold" numberOfLines={1}>
                {profile?.full_name ?? ''}
              </Text>
              <Text className="text-text-secondary font-sans text-xs mt-0.5">
                {avatarSaving ? t('common.saving') : t('client.profile.tapToChange')}
              </Text>

              <View className="flex-row items-center gap-2 mt-3">
                <Icon name="clipboard-outline" size={14} color={colors.primary} />
                <Text className="text-text-secondary font-sans text-xs flex-1" numberOfLines={1}>
                  {t('client.profile.currentPlan')}:{' '}
                  {activePlanName ?? t('client.profile.noPlanActive')}
                </Text>
              </View>

              {memberSince ? (
                <View className="flex-row items-center gap-2 mt-1.5">
                  <Icon name="calendar-outline" size={14} color={colors.primary} />
                  <Text className="text-text-secondary font-sans text-xs flex-1" numberOfLines={1}>
                    {t('client.profile.memberSince', { date: memberSince })}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </Card>

        {/* Account section */}
        <SectionHeader title={t('client.profile.account')} icon="settings-outline" />

        {/* Name form */}
        <Card className="mb-4">
          <form.Field name="fullName">
            {(f) => (
              <TextInput
                label={t('client.profile.fullName')}
                value={f.state.value}
                onChangeText={f.handleChange}
                onBlur={f.handleBlur}
                error={firstError(f.state.meta.errors)}
              />
            )}
          </form.Field>
          <PrimaryButton
            title={saving ? t('common.saving') : t('common.save')}
            loading={saving}
            onPress={() => form.handleSubmit()}
            className="mt-3"
          />
        </Card>

        {/* Language toggle */}
        <Card className="mb-4">
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center gap-2">
              <Icon name="language" size={18} color={colors.textSecondary} />
              <Text className="text-white font-sans text-sm">
                {t('client.profile.language')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleToggleLanguage}
              className="flex-row items-center gap-1.5 bg-primary/20 border border-primary/40 rounded-lg px-3 py-1.5"
            >
              <Icon name="globe-outline" size={16} color={colors.primary} />
              <Text className="text-primary font-sans text-sm">
                {i18n.language === 'ar' ? 'English' : 'العربية'}
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Assignment history */}
        <SectionHeader title={t('client.profile.history')} icon="time-outline" />
        {myAssignments.length === 0 ? (
          <Card className="mb-4">
            <EmptyState icon="time-outline" message={t('client.profile.noHistory')} />
          </Card>
        ) : (
          myAssignments.map((a) => {
            const plan = (plans ?? []).find((p) => p.id === a.plan_id);
            return (
              <Card key={a.id} className="mb-3">
                <View className="flex-row items-center gap-3">
                  <Icon name="barbell-outline" size={20} color={colors.primary} />
                  <View className="flex-1">
                    <Text className="text-white font-sans font-medium" numberOfLines={1}>
                      {plan?.name ?? a.plan_id}
                    </Text>
                    <Text className="text-text-secondary font-sans text-xs mt-1">
                      {a.start_date} · {a.status}
                    </Text>
                  </View>
                </View>
              </Card>
            );
          })
        )}

        <View className="flex-row items-center justify-center gap-2 mt-2">
          <Icon name="log-out-outline" size={18} color={colors.textSecondary} flipRTL />
          <SecondaryButton
            title={t('common.signOut')}
            onPress={handleSignOut}
            className="flex-1"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
