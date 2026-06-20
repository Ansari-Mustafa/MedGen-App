"use client";

import { useEffect, useRef, useState } from "react";
import { wsManager } from "@/lib/api/ws";
import { getReport } from "@/lib/api/endpoints/reports";
import type { PipelineStep, PipelineStatus, ReportStatus } from "@/types/models";

export const STEP_LABELS: Record<PipelineStep, string> = {
  connected: "Connecting",
  transcribe: "Transcribing audio",
  fill: "Generating report",
  generate: "Building document",
  done: "Done",
  error: "Error",
};

export const STEP_PROGRESS: Record<PipelineStep, number> = {
  connected: 5,
  transcribe: 30,
  fill: 65,
  generate: 90,
  done: 100,
  error: 100,
};

export interface PipelineState {
  step: PipelineStep;
  status: PipelineStatus | "idle";
  progress: number;
  message: string | null;
  error: string | null;
}

function fromReportStatus(status: ReportStatus): Partial<PipelineState> | null {
  switch (status) {
    case "pending":
      return { step: "transcribe", progress: 20, message: "Queued — waiting for the worker" };
    case "generating":
      return { step: "fill", progress: 60, message: "Working on your report" };
    case "ready":
    case "edited":
    case "approved":
      return { step: "done", status: "done", progress: 100, message: "Done" };
    case "error":
      return { step: "error", status: "error", progress: 100, error: "Report generation failed" };
    default:
      return null;
  }
}

export function usePipelineStatus(reportId: string | null) {
  const [state, setState] = useState<PipelineState>({
    step: "connected",
    status: "idle",
    progress: 0,
    message: null,
    error: null,
  });
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!reportId) return;

    setState({
      step: "connected",
      status: "running",
      progress: 5,
      message: "Connecting…",
      error: null,
    });

    const unsubscribe = wsManager.subscribe((event) => {
      if (event.type !== "pipeline_update") return;
      if ("report_id" in event && event.report_id !== reportId) return;
      const step = event.step as PipelineStep;
      const status = event.status as PipelineStatus;
      setState({
        step,
        status,
        progress: STEP_PROGRESS[step] ?? 0,
        message: (event as { message?: string }).message ?? STEP_LABELS[step],
        error: status === "error" ? (event as { message?: string }).message ?? "Pipeline failed" : null,
      });
    });

    const poll = async () => {
      try {
        const report = await getReport(reportId);
        const update = fromReportStatus(report.status);
        if (!update) return;
        setState((s) => {
          // Don't downgrade live WS progress with coarser polled state.
          if ((update.progress ?? 0) <= s.progress && s.status === "running") return s;
          return { ...s, ...update };
        });
      } catch {
        // ignore poll errors
      }
    };

    poll();
    pollIntervalRef.current = setInterval(poll, 3_000);

    return () => {
      unsubscribe();
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [reportId]);

  return state;
}
