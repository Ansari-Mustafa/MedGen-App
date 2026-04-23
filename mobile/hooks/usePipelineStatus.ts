import { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { wsManager } from '@/lib/wsManager';
import { getReport } from '@/services/api/reports';

export type PipelineStep = 'transcribe' | 'fill' | 'generate' | 'done' | 'error';

export interface PipelineStatus {
  step: PipelineStep;
  message: string;
  progress: number; // 0–100
}

const STEP_PROGRESS: Record<PipelineStep, number> = {
  transcribe: 30,
  fill: 60,
  generate: 85,
  done: 100,
  error: 0,
};

const STEP_LABELS: Record<PipelineStep, string> = {
  transcribe: 'Transcribing audio…',
  fill: 'Generating report content…',
  generate: 'Building document…',
  done: 'Report ready!',
  error: 'Something went wrong',
};

const TERMINAL_REPORT_STATUSES = new Set(['ready', 'edited', 'approved', 'error']);

/**
 * Listens for pipeline_update WebSocket events for a specific report, and
 * polls the report itself every few seconds as a fallback — so the overlay
 * still transitions to `done` if a WS event gets dropped mid-pipeline.
 */
export function usePipelineStatus(reportId: string | null) {
  const [status, setStatus] = useState<PipelineStatus | null>(null);

  const handleEvent = useCallback(
    (event: { type: string; report_id?: string; step?: string; message?: string }) => {
      if (event.type !== 'pipeline_update') return;
      if (event.report_id !== reportId) return;

      const step = event.step as PipelineStep;
      setStatus({
        step,
        message: (event.message as string) || STEP_LABELS[step] || step,
        progress: STEP_PROGRESS[step] ?? 0,
      });
    },
    [reportId],
  );

  useEffect(() => {
    if (!reportId) {
      setStatus(null);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return wsManager.subscribe(handleEvent as any);
  }, [reportId, handleEvent]);

  // Polling fallback. Stops once the report reaches a terminal status.
  const { data: reportSnapshot } = useQuery({
    queryKey: ['pipeline-report-status', reportId],
    queryFn: () => getReport(reportId!),
    enabled: !!reportId,
    refetchInterval: (query) => {
      const data = query.state.data as { status?: string } | undefined;
      if (data?.status && TERMINAL_REPORT_STATUSES.has(data.status)) return false;
      return 3000;
    },
    // Don't blast the network right when the screen opens — the WS will usually
    // win. If it doesn't, this kicks in a few seconds later.
    refetchOnMount: false,
  });

  useEffect(() => {
    if (!reportSnapshot) return;
    const s = (reportSnapshot as { status?: string }).status;
    if (!s) return;

    // Never overwrite an existing terminal WS-reported state.
    if (status?.step === 'done' || status?.step === 'error') return;

    if (s === 'ready' || s === 'edited' || s === 'approved') {
      setStatus({ step: 'done', message: STEP_LABELS.done, progress: 100 });
    } else if (s === 'error') {
      setStatus({ step: 'error', message: STEP_LABELS.error, progress: 0 });
    }
  }, [reportSnapshot, status?.step]);

  return status;
}
