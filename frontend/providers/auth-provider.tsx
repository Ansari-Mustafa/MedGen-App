"use client";

import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function AuthProvider({ children }: { children: ReactNode }) {
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    bootstrap();
    const supabase = getSupabaseBrowserClient();
    const { data: sub } = supabase.auth.onAuthStateChange((event: string) => {
      if (event === "SIGNED_OUT") setUser(null);
      if (event === "TOKEN_REFRESHED" || event === "SIGNED_IN") {
        // Re-fetch profile to keep it fresh
        bootstrap();
      }
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, [bootstrap, setUser]);

  return <>{children}</>;
}
