import axios from 'axios';
import { supabase } from './supabase';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

/** Inject the Supabase JWT before every request. */
api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** On 401, try refreshing the session once before failing. */
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const { data } = await supabase.auth.refreshSession();
      if (data.session?.access_token) {
        error.config.headers.Authorization = `Bearer ${data.session.access_token}`;
        return api(error.config);
      }
    }
    return Promise.reject(error);
  },
);

/** Derive WebSocket base from HTTP URL (http→ws, https→wss). */
export const WS_BASE_URL = API_BASE_URL.replace(/^https/, 'wss').replace(/^http/, 'ws');
