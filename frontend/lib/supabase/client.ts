"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

let _client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (!_client) {
    _client = createBrowserClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  }
  return _client;
}
