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

function summarizeBody(body: unknown): string {
  if (body == null) return '';
  if (typeof body === 'string') {
    // ngrok's offline page + any HTML — avoid spamming Metro with it.
    if (body.includes('ERR_NGROK') || body.includes('ngrok')) {
      return '(ngrok tunnel offline)';
    }
    if (body.startsWith('<!DOCTYPE') || body.startsWith('<html')) {
      return '(HTML response, not backend — check EXPO_PUBLIC_API_URL)';
    }
    return body.length > 200 ? `${body.slice(0, 200)}…` : body;
  }
  try {
    const s = JSON.stringify(body);
    return s.length > 200 ? `${s.slice(0, 200)}…` : s;
  } catch {
    return '(unserializable body)';
  }
}

/** On 401, try refreshing the session once before failing. Log other errors. */
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error.response?.status;
    const method = error.config?.method?.toUpperCase() ?? 'GET';
    const url = error.config?.url ?? '';

    if (status === 401) {
      if (!error.config._retry) {
        error.config._retry = true;
        try {
          const { data } = await supabase.auth.refreshSession();
          if (data.session?.access_token) {
            error.config.headers.Authorization = `Bearer ${data.session.access_token}`;
            return api(error.config);
          }
        } catch {
          // Refresh failed; fall through to logout below
        }
      }
      // Either the initial token was rejected and refresh didn't produce a
      // usable session, or the retried request also 401'd. Force logout so
      // the user lands on the auth screens with a clear message.
      await supabase.auth.signOut();
      const { useAuthStore } = require('@/stores/authStore');
      await useAuthStore.getState().logout('Session expired. Please sign in again.');
    } else if (status && status >= 400) {
      // eslint-disable-next-line no-console
      console.warn('[api]', method, url, '→', status, summarizeBody(error.response?.data));
    } else if (!status) {
      // eslint-disable-next-line no-console
      console.warn('[api]', method, url, '→ network error', error.message);
    }
    return Promise.reject(error);
  },
);

/** Derive WebSocket base from HTTP URL (http→ws, https→wss). */
export const WS_BASE_URL = API_BASE_URL.replace(/^https/, 'wss').replace(/^http/, 'ws');
