"use client";

import { useEffect, useState } from "react";
import { wsManager } from "@/lib/api/ws";
import type { OnboardingSnapshot, OnboardingStep } from "@/types/models";

export const ONBOARDING_LABELS: Record<OnboardingStep, string> = {
  connected: "Connecting",
  upload: "Uploading reports",
  extract: "Extracting structure",
  architect: "Analysing your style",
  transform: "Building template",
  finalize: "Finalising",
  done: "Done",
  error: "Error",
};

export const ONBOARDING_PROGRESS: Record<OnboardingStep, number> = {
  connected: 5,
  upload: 10,
  extract: 30,
  architect: 55,
  transform: 80,
  finalize: 95,
  done: 100,
  error: 100,
};

export function useOnboardingStatus(jobId: string | null) {
  const [snapshot, setSnapshot] = useState<OnboardingSnapshot>({
    step: "connected",
    message: "Connecting…",
    progress: 0,
  });

  useEffect(() => {
    if (!jobId) return;
    setSnapshot({ step: "connected", message: "Connecting…", progress: 5 });

    const unsubscribe = wsManager.subscribe((event) => {
      if (event.type !== "template_onboarding") return;
      if ("job_id" in event && event.job_id !== jobId) return;
      const step = event.step as OnboardingStep;
      setSnapshot({
        step,
        message:
          (event as { message?: string }).message ?? ONBOARDING_LABELS[step] ?? "",
        progress:
          (event as { progress?: number }).progress ?? ONBOARDING_PROGRESS[step] ?? 0,
      });
    });

    return unsubscribe;
  }, [jobId]);

  return snapshot;
}
