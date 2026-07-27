import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { config } from './env';
import { createChunkedStore } from '@/lib/secureStore';

const ExpoSecureStoreAdapter = createChunkedStore({
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
});

/**
 * This device's SecureStore has been observed to intermittently drop the
 * persisted session (reads come back empty right after a successful write),
 * causing supabase-js to silently fall back to the anon key for every request
 * and making authenticated queries fail with RLS-filtered 406s. We track the
 * access token ourselves - straight from signInWithPassword's own return value
 * and onAuthStateChange, no storage round-trip involved - and patch it into
 * outgoing requests whenever supabase-js would otherwise send the anon key.
 */
let cachedAccessToken: string | null = null;

const FETCH_TIMEOUT_MS = 15_000;

function fetchWithAuthFallback(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  const authHeader = headers.get('authorization') ?? '';
  const currentToken = authHeader.replace(/^Bearer\s+/i, '');
  if (cachedAccessToken && currentToken === config.supabaseAnonKey) {
    headers.set('authorization', `Bearer ${cachedAccessToken}`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  return fetch(input, { ...init, headers, signal: controller.signal }).finally(() => clearTimeout(timeout));
}

export const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    fetch: fetchWithAuthFallback,
  },
});

supabase.auth.onAuthStateChange((_event, session) => {
  cachedAccessToken = session?.access_token ?? null;
});
