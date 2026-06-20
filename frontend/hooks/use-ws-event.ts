"use client";

import { useEffect } from "react";
import { wsManager, type WSEvent } from "@/lib/api/ws";

export function useWsEvent(handler: (event: WSEvent) => void) {
  useEffect(() => {
    return wsManager.subscribe(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
