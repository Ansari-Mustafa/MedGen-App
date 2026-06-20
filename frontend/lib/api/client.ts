"use client";

import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { env } from "@/lib/env";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export const api = axios.create({
  baseURL: env.API_BASE_URL,
  timeout: 30_000,
});

api.interceptors.request.use(async (config) => {
  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) {
    config.headers.Authorization = `Bearer ${data.session.access_token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      try {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase.auth.refreshSession();
        if (data.session) {
          original.headers = {
            ...(original.headers ?? {}),
            Authorization: `Bearer ${data.session.access_token}`,
          };
          return api(original);
        }
        await supabase.auth.signOut();
        if (typeof window !== "undefined") {
          window.location.replace("/login");
        }
      } catch {
        if (typeof window !== "undefined") {
          window.location.replace("/login");
        }
      }
    }
    return Promise.reject(error);
  }
);

export const WS_BASE_URL = env.API_BASE_URL.replace(/^https/, "wss").replace(
  /^http/,
  "ws"
);

export async function getAuthToken(): Promise<string | null> {
  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
