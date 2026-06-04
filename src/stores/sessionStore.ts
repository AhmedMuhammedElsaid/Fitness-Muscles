import { Store, useStore } from '@tanstack/react-store';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/config/supabase';
import { queryClient } from '@/config/queryClient';
import type { Tables } from '@/types/db';

type Profile = Tables<'profiles'>;
type Role = 'coach' | 'client';

interface SessionState {
  session: Session | null;
  profile: Profile | null;
  role: Role | null;
  isLoading: boolean;
}

export const sessionStore = new Store<SessionState>({
  session: null,
  profile: null,
  role: null,
  isLoading: true,
});

function toRole(value: string | null | undefined): Role | null {
  return value === 'coach' || value === 'client' ? value : null;
}

async function loadProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data as Profile;
}

async function applySession(session: Session | null): Promise<void> {
  if (!session) {
    sessionStore.setState((s) => ({ ...s, session: null, profile: null, role: null, isLoading: false }));
    return;
  }
  const profile = await loadProfile(session.user.id);
  sessionStore.setState((s) => ({
    ...s,
    session,
    profile,
    role: toRole(profile?.role),
    isLoading: false,
  }));
}

let unsubscribe: (() => void) | null = null;

export function initSession(): () => void {
  if (unsubscribe) return unsubscribe;

  void supabase.auth.getSession().then(({ data }) => applySession(data.session));

  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_OUT') {
      void queryClient.invalidateQueries();
    }
    void applySession(session);
  });

  unsubscribe = () => {
    data.subscription.unsubscribe();
    unsubscribe = null;
  };
  return unsubscribe;
}

export function useSessionStore(): SessionState;
export function useSessionStore<T>(selector: (state: SessionState) => T): T;
export function useSessionStore<T>(selector?: (state: SessionState) => T) {
  return useStore(sessionStore, selector as ((state: SessionState) => T) | undefined);
}

export type { SessionState, Role, Profile };
