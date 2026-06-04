import { useEffect, useRef, type ReactNode } from 'react';
import { initSession, sessionStore } from '@/stores/sessionStore';
import { subscribeRealtime } from '@/db/collections';

interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const realtimeTeardownRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const teardownSession = initSession();

    const subscription = sessionStore.subscribe(() => {
      const { session } = sessionStore.state;
      if (session && !realtimeTeardownRef.current) {
        realtimeTeardownRef.current = subscribeRealtime();
      } else if (!session && realtimeTeardownRef.current) {
        realtimeTeardownRef.current();
        realtimeTeardownRef.current = null;
      }
    });

    return () => {
      teardownSession();
      realtimeTeardownRef.current?.();
      subscription.unsubscribe();
    };
  }, []);

  return <>{children}</>;
}
