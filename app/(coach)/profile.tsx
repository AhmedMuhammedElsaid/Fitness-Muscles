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
import { I18nManager } from 'react-native';
import { supabase } from '@/config/supabase';
import { useSessionStore } from '@/stores/sessionStore';
import { useUploadAvatar } from '@/api';
import {
  PrimaryButton,
  TextInput,
  Card,
  Icon,
  Avatar,
  SectionHeader,
} from '@/components/ui';
import { firstError } from '@/lib/formError';
import i18n from '@/lib/i18n';
import { colors } from '@/theme/tokens';

const profileSchema = z.object({
  fullName: z.string().min(1, 'Name is required'),
});

export default function CoachProfileScreen() {
  const { t } = useTranslation();
  const profile = useSessionStore((s) => s.profile);
  const [saving, setSaving] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const uploadAvatar = useUploadAvatar();

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
      t('coach.profile.signOutTitle', 'Sign Out'),
      t('coach.profile.signOutConfirm', 'Are you sure you want to sign out?'),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('common.signOut', 'Sign Out'),
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
      // On native, RTL change requires an app reload to fully take effect.
      Alert.alert(
        t('coach.profile.rtlTitle', 'Language Changed'),
        t('coach.profile.rtlRestart', 'Restart the app to apply the new layout direction.'),
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1" contentContainerClassName="px-7 pt-4 pb-10">
        <Text className="text-white font-sans text-xl font-semibold mb-6">
          {t('coach.profile.title', 'Profile')}
        </Text>

        {/* Header summary */}
        <Card className="mb-6">
          <View className="flex-row items-center gap-4">
            <TouchableOpacity onPress={handlePickAvatar} disabled={avatarSaving}>
              <Avatar uri={profile?.avatar_url} name={profile?.full_name ?? ''} size="lg" />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-white font-sans text-lg font-semibold" numberOfLines={1}>
                {profile?.full_name ?? ''}
              </Text>
              <Text className="text-text-secondary font-sans text-xs mt-0.5">
                {avatarSaving
                  ? t('common.saving', 'Uploading...')
                  : t('coach.profile.tapToChange', 'Tap to change')}
              </Text>

              <View className="flex-row items-center gap-2 mt-3">
                <Icon name="shield-checkmark-outline" size={14} color={colors.primary} />
                <Text className="text-text-secondary font-sans text-xs flex-1" numberOfLines={1}>
                  {t('coach.profile.role', 'Coach')}
                </Text>
              </View>

              {memberSince ? (
                <View className="flex-row items-center gap-2 mt-1.5">
                  <Icon name="calendar-outline" size={14} color={colors.primary} />
                  <Text className="text-text-secondary font-sans text-xs flex-1" numberOfLines={1}>
                    {t('coach.profile.memberSince', 'Member since {{date}}', { date: memberSince })}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </Card>

        {/* Account section */}
        <SectionHeader title={t('coach.profile.account', 'Account')} icon="settings-outline" />

        {/* Name form */}
        <Card className="mb-4">
          <form.Field name="fullName">
            {(f) => (
              <TextInput
                label={t('coach.profile.fullName', 'Full Name')}
                value={f.state.value}
                onChangeText={f.handleChange}
                onBlur={f.handleBlur}
                error={firstError(f.state.meta.errors)}
              />
            )}
          </form.Field>
          <PrimaryButton
            title={saving ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
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
                {t('coach.profile.language', 'Language')}
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

        {/* Sign out */}
        <TouchableOpacity
          onPress={handleSignOut}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={t('common.signOut', 'Sign Out')}
          className="flex-row items-center justify-center gap-2 border border-danger rounded-button py-4 mt-2"
        >
          <Icon name="log-out-outline" size={18} color={colors.danger} flipRTL />
          <Text className="text-danger font-sans font-semibold text-base">
            {t('common.signOut', 'Sign Out')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
