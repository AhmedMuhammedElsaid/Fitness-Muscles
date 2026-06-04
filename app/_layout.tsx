import 'react-native-reanimated';
import '../src/global.css';
import { useEffect } from 'react';
import { I18nManager } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Sentry from '@sentry/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import i18n from '@/lib/i18n';
import { queryClient } from '@/config/queryClient';
import { supabase } from '@/config/supabase';
import { useAuthStore } from '@/stores/authStore';

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

function RootLayout() {
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      SplashScreen.hideAsync();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [setSession]);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#1A1A1A' },
          animation: 'slide_from_right',
        }}
      />
    </QueryClientProvider>
  );
}

export default Sentry.wrap(RootLayout);
