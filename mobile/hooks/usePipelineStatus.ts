import { useEffect, useState, useCallback } from 'react';
import { wsManager } from '@/lib/wsManager';

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

/**
 * Listens for pipeline_update WebSocket events for a specific report.
 * Returns null until the first update arrives.
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
    if (!reportId) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return wsManager.subscribe(handleEvent as any);
  }, [reportId, handleEvent]);

  return status;
}
