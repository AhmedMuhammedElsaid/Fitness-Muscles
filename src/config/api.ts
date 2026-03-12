import axios from 'axios';
import { config } from './env';
import { supabase } from './supabase';

export const api = axios.create({
  baseURL: `${config.apiUrl}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach Supabase access token to every request
api.interceptors.request.use(async (reqConfig) => {
  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) {
    reqConfig.headers.Authorization = `Bearer ${data.session.access_token}`;
  }
  return reqConfig;
});

// Global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      supabase.auth.signOut();
    }
    return Promise.reject(error);
  },
);
