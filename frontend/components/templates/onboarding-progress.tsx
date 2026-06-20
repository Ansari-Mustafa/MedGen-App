"use client";

import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  ONBOARDING_LABELS,
  useOnboardingStatus,
} from "@/hooks/use-onboarding-status";
import type { OnboardingStep } from "@/types/models";

const STEPS: OnboardingStep[] = [
  "upload",
  "extract",
  "architect",
  "transform",
  "finalize",
  "done",
];

export function OnboardingProgress({ jobId }: { jobId: string | null }) {
  const snap = useOnboardingStatus(jobId);
  const stepIndex = STEPS.indexOf(snap.step as OnboardingStep);
  const isError = snap.step === "error";
  const isDone = snap.step === "done";

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-sm font-medium">
        {isError ? (
          <>
            <AlertCircle className="h-4 w-4 text-error" />
            <span className="text-error">Onboarding failed</span>
          </>
        ) : isDone ? (
          <>
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span>Template ready</span>
          </>
        ) : (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>{snap.message || ONBOARDING_LABELS[snap.step]}</span>
          </>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Progress value={snap.progress} />
        <span className="text-right text-xs tabular-nums text-muted-foreground">
          {Math.round(snap.progress)}%
        </span>
      </div>

      <ol className="flex flex-col gap-2">
        {STEPS.map((step, i) => {
          const reached = stepIndex >= i || isDone;
          const active = stepIndex === i && !isDone && !isError;
          return (
            <li
              key={step}
              className="flex items-center gap-3 text-sm"
              data-active={reached || undefined}
            >
              <span
                className={
                  reached
                    ? "grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-fg"
                    : "grid h-5 w-5 place-items-center rounded-full bg-surface-2 text-muted-foreground"
                }
              >
                {active ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : reached ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                )}
              </span>
              <span className={reached ? "text-foreground" : "text-muted-foreground"}>
                {ONBOARDING_LABELS[step]}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
