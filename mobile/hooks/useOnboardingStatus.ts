import { useCallback, useEffect, useState } from 'react';

import { wsManager } from '@/lib/wsManager';
import type { OnboardingSnapshot, OnboardingStep } from '@/types/models';

const STEP_PROGRESS: Record<OnboardingStep, number> = {
  upload: 10,
  extract: 30,
  architect: 55,
  transform: 80,
  finalize: 95,
  done: 100,
  error: 0,
  connected: 0,
};

const STEP_LABELS: Record<OnboardingStep, string> = {
  upload: 'Uploading past reports…',
  extract: 'Reading your reports…',
  architect: 'Learning your report structure…',
  transform: 'Building your template…',
  finalize: 'Saving template…',
  done: 'Template ready!',
  error: 'Something went wrong',
  connected: 'Connecting…',
};

/**
 * Subscribes to template_onboarding WebSocket events for a specific job.
 * Returns null until the first event arrives.
 */
export function useOnboardingStatus(jobId: string | null): OnboardingSnapshot | null {
  const [status, setStatus] = useState<OnboardingSnapshot | null>(null);

  const handleEvent = useCallback(
    (event: { type: string; job_id?: string; step?: string; progress?: number; message?: string }) => {
      if (event.type !== 'template_onboarding') return;
      if (!jobId || event.job_id !== jobId) return;

      const step = (event.step ?? 'connected') as OnboardingStep;
      setStatus({
        step,
        message: event.message ?? STEP_LABELS[step] ?? step,
        progress: typeof event.progress === 'number' ? event.progress : STEP_PROGRESS[step] ?? 0,
      });
    },
    [jobId],
  );

  useEffect(() => {
    if (!jobId) {
      setStatus(null);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return wsManager.subscribe(handleEvent as any);
  }, [jobId, handleEvent]);

  return status;
}
