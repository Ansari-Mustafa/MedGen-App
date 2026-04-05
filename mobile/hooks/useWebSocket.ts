import { useEffect, useState } from 'react';
import { wsManager, WSEvent } from '@/lib/wsManager';

type Listener = (event: WSEvent) => void;

/**
 * Provides access to the shared WebSocket connection.
 * Subscribe to events via the returned `subscribe` function.
 * The connection itself is managed globally by _layout.tsx.
 */
export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(wsManager.connected);

  useEffect(() => {
    const unsub = wsManager.onConnectionChange(setIsConnected);
    return unsub;
  }, []);

  return { isConnected, subscribe: wsManager.subscribe.bind(wsManager) };
}

/** Convenience hook to run a callback on every WS event. */
export function useWSListener(listener: Listener) {
  useEffect(() => {
    return wsManager.subscribe(listener);
  }, [listener]);
}
