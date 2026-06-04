import { config } from './env';
import { supabase } from './supabase';

type Json = Record<string, unknown> | unknown[];

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(method: string, path: string, body?: Json): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (data.session?.access_token) {
    headers.Authorization = `Bearer ${data.session.access_token}`;
  }

  const response = await fetch(`${config.apiUrl}/api${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 401) {
    await supabase.auth.signOut();
  }

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as T) : (undefined as T);

  if (!response.ok) {
    throw new ApiError(response.status, response.statusText);
  }

  return payload;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: Json) => request<T>('POST', path, body),
  put: <T>(path: string, body?: Json) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: Json) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};

export { ApiError };
