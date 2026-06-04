import { useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/config/supabase';
import { useSessionStore } from '@/stores/sessionStore';
import {
  clearOnboardingDraft,
  setOnboardingStep,
  useOnboardingStore,
} from '@/stores/onboardingStore';
import { refreshAssignmentStatus } from '@/stores/sessionStore';
import { PrimaryButton } from '@/components/ui';
import { toast } from '@/components/feedback/Toast';
import { uuidv4 } from '@/lib/uuid';
import { useState } from 'react';

export default function RequestSentScreen() {
  const { t } = useTranslation();
  const profile = useSessionStore((s) => s.profile);
  const draft = useOnboardingStore((s) => s.draft);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);
  const didSubmit = useRef(false);

  setOnboardingStep(8);

  useEffect(() => {
    if (didSubmit.current || !profile) return;
    didSubmit.current = true;

    void (async () => {
      try {
        const now = new Date().toISOString();

        // Update profile full_name from basic_info if provided
        if (draft.basicInfo?.fullName && draft.basicInfo.fullName !== profile.full_name) {
          await supabase
            .from('profiles')
            .update({ full_name: draft.basicInfo.fullName })
            .eq('id', profile.id);
        }

        // Write client_intake row (upsert in case they got this far before)
        const { error: intakeError } = await supabase.from('client_intake').upsert(
          {
            id: uuidv4(),
            profile_id: profile.id,
            basic_info: draft.basicInfo ?? null,
            body_metrics: draft.bodyMetrics ?? null,
            fitness_goals: draft.fitnessGoals ?? null,
            health_restrictions: draft.healthRestrictions ?? null,
            nutrition_prefs: draft.nutritionPrefs ?? null,
            workout_prefs: draft.workoutPrefs ?? null,
            completed_at: now,
            updated_at: now,
          },
          { onConflict: 'profile_id' },
        );

        if (intakeError) throw intakeError;

        await clearOnboardingDraft();
        await refreshAssignmentStatus();
        setSubmitted(true);
      } catch {
        setError(true);
        toast.error('mutation.failed');
      }
    })();
  }, [profile, draft]);

  if (error) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-7">
        <Text className="text-white font-sans text-lg text-center mb-6">
          {t('common.errorMessage')}
        </Text>
        <PrimaryButton
          title={t('common.retry')}
          onPress={() => {
            didSubmit.current = false;
            setError(false);
          }}
        />
      </View>
    );
  }

  if (!submitted) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#E8DEB5" size="large" />
        <Text className="text-text-secondary font-sans text-sm mt-4">
          {t('common.loading')}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background items-center justify-center px-7">
      <Text className="text-primary font-sans text-5xl mb-6">✓</Text>
      <Text className="text-white font-sans text-2xl font-semibold text-center mb-3">
        {t('onboarding.requestSent.title')}
      </Text>
      <Text className="text-text-secondary text-center text-sm mb-10">
        {t('onboarding.requestSent.subtitle')}
      </Text>
      <PrimaryButton
        title={t('onboarding.requestSent.cta')}
        onPress={() => router.replace('/(client)/home')}
        className="w-full"
      />
    </View>
  );
}
