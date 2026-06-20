"use client";

import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { wsManager } from "@/lib/api/ws";

export function WSProvider({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      wsManager.connect();
      return () => {
        wsManager.disconnect();
      };
    }
  }, [isAuthenticated]);

  return <>{children}</>;
}
