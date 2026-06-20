"use client";

import { WS_BASE_URL, getAuthToken } from "@/lib/api/client";
import type {
  OnboardingStep,
  PipelineStatus,
  PipelineStep,
} from "@/types/models";

export type WSEvent =
  | { type: "connected"; user_id?: string }
  | {
      type: "pipeline_update";
      step: PipelineStep;
      status: PipelineStatus;
      report_id: string;
      message?: string;
    }
  | {
      type: "template_onboarding";
      step: OnboardingStep;
      status: PipelineStatus;
      job_id: string;
      template_id?: string;
      progress?: number;
      message?: string;
      chosen_report_index?: number;
    }
  | {
      type: "notification";
      title: string;
      body: string;
      data?: Record<string, unknown>;
    }
  | { type: "ping" }
  | { type: string; [k: string]: unknown };

type Listener = (event: WSEvent) => void;
type ConnectionListener = (connected: boolean) => void;

class WSManager {
  private ws: WebSocket | null = null;
  private listeners = new Set<Listener>();
  private connListeners = new Set<ConnectionListener>();
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private intentionalClose = false;
  private connecting = false;
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  async connect() {
    if (this.connecting || this.ws?.readyState === WebSocket.OPEN) return;
    this.connecting = true;
    this.intentionalClose = false;

    const token = await getAuthToken();
    if (!token) {
      this.connecting = false;
      return;
    }

    try {
      const url = `${WS_BASE_URL}/ws/notifications?token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(url);
      this.ws = ws;

      ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.connecting = false;
        this.notifyConn(true);
        this.startPing();
      };

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data) as WSEvent;
          this.listeners.forEach((l) => l(data));
        } catch {
          // ignore non-json frames
        }
      };

      ws.onclose = () => {
        this.connecting = false;
        this.stopPing();
        this.notifyConn(false);
        if (!this.intentionalClose) this.scheduleReconnect();
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      this.connecting = false;
      this.scheduleReconnect();
    }
  }

  disconnect() {
    this.intentionalClose = true;
    this.stopPing();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.ws?.close();
    this.ws = null;
    this.notifyConn(false);
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  onConnectionChange(listener: ConnectionListener): () => void {
    this.connListeners.add(listener);
    return () => {
      this.connListeners.delete(listener);
    };
  }

  isOpen(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private notifyConn(connected: boolean) {
    this.connListeners.forEach((l) => l(connected));
  }

  private scheduleReconnect() {
    if (this.intentionalClose) return;
    const delay = Math.min(30_000, 1000 * 2 ** this.reconnectAttempts);
    this.reconnectAttempts += 1;
    this.reconnectTimeout = setTimeout(() => this.connect(), delay);
  }

  private startPing() {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify({ type: "pong" }));
        } catch {
          // ignore
        }
      }
    }, 30_000);
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}

export const wsManager = new WSManager();
