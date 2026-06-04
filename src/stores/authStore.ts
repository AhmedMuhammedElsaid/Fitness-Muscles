import { Store, useStore } from '@tanstack/react-store';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/config/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  userRole: 'client' | 'coach' | null;
  setSession: (session: Session | null) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  socialLogin: (provider: 'google' | 'apple' | 'facebook') => Promise<void>;
  logout: () => Promise<void>;
}

export const authStore = new Store<AuthState>({
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,
  userRole: null,

  setSession: (session) =>
    authStore.setState((s) => ({
      ...s,
      session,
      user: session?.user ?? null,
      isAuthenticated: !!session,
      isLoading: false,
    })),

  login: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  signup: async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  },

  socialLogin: async (provider) => {
    const { error } = await supabase.auth.signInWithOAuth({ provider });
    if (error) throw error;
  },

  logout: async () => {
    await supabase.auth.signOut();
    authStore.setState((s) => ({
      ...s,
      user: null,
      session: null,
      isAuthenticated: false,
      userRole: null,
    }));
  },
});

export function useAuthStore(): AuthState;
export function useAuthStore<T>(selector: (state: AuthState) => T): T;
export function useAuthStore<T>(selector?: (state: AuthState) => T) {
  return useStore(authStore, selector as ((state: AuthState) => T) | undefined);
}
