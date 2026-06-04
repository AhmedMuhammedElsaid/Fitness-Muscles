import 'react-native-reanimated';
import '../src/global.css';
import { useEffect } from 'react';
import { I18nManager } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Sentry from '@sentry/react-native';
import * as SplashScreen from 'expo-splash-screen';
import { I18nextProvider } from 'react-i18next';
import { QueryClientProvider } from '@tanstack/react-query';
import i18n from '@/lib/i18n';
import { queryClient } from '@/config/queryClient';
import { useSessionStore } from '@/stores/sessionStore';
import { SessionProvider } from '@/providers/SessionProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({ dsn: sentryDsn, sendDefaultPii: false });
}

const shouldBeRTL = i18n.dir() === 'rtl';
if (I18nManager.isRTL !== shouldBeRTL) {
  I18nManager.allowRTL(shouldBeRTL);
  I18nManager.forceRTL(shouldBeRTL);
}

SplashScreen.preventAutoHideAsync();

function RoleGate() {
  const { session, role, isLoading, hasActiveAssignment } = useSessionStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    void SplashScreen.hideAsync();

    const topSegment = segments[0] as string | undefined;
    const inAuth = topSegment === 'auth';
    const inCoach = topSegment === '(coach)';
    const inClient = topSegment === '(client)';
    const inOnboarding = topSegment === 'onboarding-form';

    if (!session) {
      if (!inAuth) router.replace('/auth/login');
      return;
    }

    if (role === 'coach') {
      if (!inCoach) router.replace('/(coach)/home');
      return;
    }

    if (role === 'client') {
      // hasActiveAssignment === null means we're still loading the assignment status
      if (hasActiveAssignment === null) return;
      if (hasActiveAssignment) {
        if (!inClient) router.replace('/(client)/home');
      } else {
        if (!inOnboarding) router.replace('/onboarding-form/trainer-code');
      }
    }
  }, [session, role, isLoading, hasActiveAssignment, segments, router]);

  return null;
}

function RootLayout() {
  return (
    <ErrorBoundary>
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>
          <SessionProvider>
            <StatusBar style="light" />
            <RoleGate />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#1A1A1A' },
                animation: 'slide_from_right',
              }}
            />
          </SessionProvider>
        </QueryClientProvider>
      </I18nextProvider>
    </ErrorBoundary>
  );
}

export default Sentry.wrap(RootLayout);
