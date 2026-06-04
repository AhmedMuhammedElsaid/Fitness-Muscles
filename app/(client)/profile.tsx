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
import { PrimaryButton, SecondaryButton, TextInput, Card } from '@/components/ui';
import { firstError } from '@/lib/formError';
import i18n from '@/lib/i18n';

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

        {/* Avatar */}
        <View className="items-center mb-6">
          <TouchableOpacity onPress={handlePickAvatar} disabled={avatarSaving}>
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={{ width: 80, height: 80, borderRadius: 40 }}
                contentFit="cover"
              />
            ) : (
              <View className="w-20 h-20 rounded-full bg-surface items-center justify-center">
                <Text className="text-3xl">👤</Text>
              </View>
            )}
          </TouchableOpacity>
          <Text className="text-text-secondary font-sans text-xs mt-2">
            {avatarSaving ? t('common.saving') : t('client.profile.tapToChange')}
          </Text>
        </View>

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
            <Text className="text-white font-sans text-sm">
              {t('client.profile.language')}
            </Text>
            <TouchableOpacity
              onPress={handleToggleLanguage}
              className="bg-primary/20 border border-primary/40 rounded-lg px-3 py-1.5"
            >
              <Text className="text-primary font-sans text-sm">
                {i18n.language === 'ar' ? 'English' : 'العربية'}
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Assignment history */}
        <Text className="text-white font-sans font-medium mb-3">
          {t('client.profile.history')}
        </Text>
        {myAssignments.length === 0 ? (
          <Card className="mb-4">
            <Text className="text-text-secondary font-sans text-sm text-center py-2">
              {t('client.profile.noHistory')}
            </Text>
          </Card>
        ) : (
          myAssignments.map((a) => {
            const plan = (plans ?? []).find((p) => p.id === a.plan_id);
            return (
              <Card key={a.id} className="mb-3">
                <Text className="text-white font-sans font-medium">
                  {plan?.name ?? a.plan_id}
                </Text>
                <Text className="text-text-secondary font-sans text-xs mt-1">
                  {a.start_date} · {a.status}
                </Text>
              </Card>
            );
          })
        )}

        <SecondaryButton
          title={t('common.signOut')}
          onPress={handleSignOut}
          className="mt-2"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
