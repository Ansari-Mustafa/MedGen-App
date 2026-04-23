/**
 * Singleton WebSocket manager.
 * Call wsManager.connect() once when authenticated (e.g., in _layout.tsx).
 * Call wsManager.disconnect() on logout.
 * Use wsManager.subscribe(listener) to react to incoming events.
 */
import { supabase } from './supabase';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';
const WS_BASE_URL = API_BASE_URL.replace(/^https/, 'wss').replace(/^http/, 'ws');

export type WSEvent = {
  type: 'pipeline_update' | 'template_onboarding' | 'notification' | 'connected';
  [key: string]: unknown;
};

type Listener = (event: WSEvent) => void;
type ConnectionListener = (connected: boolean) => void;

class WebSocketManager {
  private ws: WebSocket | null = null;
  private listeners = new Set<Listener>();
  private connectionListeners = new Set<ConnectionListener>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 1000;
  private shouldConnect = false;
  private isConnected = false;

  async connect() {
    this.shouldConnect = true;

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;

    // Close existing connection before reconnecting
    if (this.ws) {
      this.ws.onclose = null; // prevent reconnect loop
      this.ws.close();
      this.ws = null;
    }

    const ws = new WebSocket(`${WS_BASE_URL}/ws/notifications?token=${token}`);
    this.ws = ws;

    ws.onopen = () => {
      this.isConnected = true;
      this.reconnectDelay = 1000;
      this.connectionListeners.forEach((l) => l(true));
    };

    ws.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as WSEvent;
        this.listeners.forEach((l) => l(event));
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      this.isConnected = false;
      this.ws = null;
      this.connectionListeners.forEach((l) => l(false));

      if (!this.shouldConnect) return;

      this.reconnectTimer = setTimeout(() => {
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30_000);
        this.connect();
      }, this.reconnectDelay);
    };

    ws.onerror = () => {
      ws.close();
    };
  }

  disconnect() {
    this.shouldConnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.connectionListeners.forEach((l) => l(false));
  }

  /** Subscribe to incoming WS events. Returns an unsubscribe function. */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Subscribe to connection state changes. Returns an unsubscribe function. */
  onConnectionChange(listener: ConnectionListener): () => void {
    this.connectionListeners.add(listener);
    return () => {
      this.connectionListeners.delete(listener);
    };
  }

  get connected() {
    return this.isConnected;
  }
}

export const wsManager = new WebSocketManager();
