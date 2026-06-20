"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  FileText,
  Loader2,
  AlertCircle,
  WifiOff,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { usePipelineStatus, STEP_LABELS } from "@/hooks/use-pipeline-status";
import { wsManager } from "@/lib/api/ws";

export function PipelineOverlay({
  reportId,
  open,
  onOpenChange,
}: {
  reportId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const status = usePipelineStatus(open ? reportId : null);
  const [wsConnected, setWsConnected] = useState(wsManager.isOpen());
  const [openedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());

  const isDone = status.step === "done";
  const isError = status.step === "error" || status.error != null;
  const elapsedS = Math.floor((now - openedAt) / 1000);
  const isStuck = !isDone && !isError && status.progress <= 20 && elapsedS > 15;

  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [open]);

  useEffect(() => {
    return wsManager.onConnectionChange(setWsConnected);
  }, []);

  useEffect(() => {
    if (isDone && reportId) {
      const t = setTimeout(() => {
        onOpenChange(false);
        router.push(`/reports/${reportId}`);
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [isDone, reportId, router, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isError ? (
              <AlertCircle className="h-5 w-5 text-error" />
            ) : isDone ? (
              <CheckCircle2 className="h-5 w-5 text-success" />
            ) : (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            )}
            {isError ? "Generation failed" : isDone ? "Report ready" : "Generating report"}
          </DialogTitle>
          <DialogDescription>
            {isError
              ? status.error ?? "Something went wrong. Please try again."
              : isDone
              ? "Opening your report…"
              : status.message ?? STEP_LABELS[status.step]}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <Progress value={status.progress} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{STEP_LABELS[status.step]}</span>
            <span className="tabular-nums">{Math.round(status.progress)}%</span>
          </div>

          <ol className="mt-2 flex flex-col gap-2 text-sm">
            {(["transcribe", "fill", "generate", "done"] as const).map((s) => {
              const reached = !isError && status.progress >= getMinFor(s);
              return (
                <li
                  key={s}
                  className="flex items-center gap-2.5 text-muted-foreground data-[active=true]:text-foreground"
                  data-active={reached}
                >
                  <span
                    className={
                      reached
                        ? "grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-fg"
                        : "grid h-5 w-5 place-items-center rounded-full bg-surface-2 text-muted-foreground"
                    }
                  >
                    {reached ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    )}
                  </span>
                  {STEP_LABELS[s]}
                </li>
              );
            })}
          </ol>

          {!wsConnected && !isDone && !isError && (
            <div className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning-soft px-3 py-2 text-xs text-warning">
              <WifiOff className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                Live updates aren&apos;t connected. We&apos;re polling progress
                every few seconds instead.
              </span>
            </div>
          )}

          {isStuck && (
            <div className="rounded-md border border-info/40 bg-info-soft px-3 py-2 text-xs text-info">
              Still queued after {elapsedS}s. Make sure the backend ARQ worker
              is running:
              <code className="mt-1 block rounded bg-card px-2 py-1 font-mono text-[11px] text-foreground">
                python -m arq backend.worker.WorkerSettings
              </code>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            {isError && (
              <Button onClick={() => onOpenChange(false)} variant="outline">
                Close
              </Button>
            )}
            {!isDone && !isError && (
              <>
                <Button variant="ghost" onClick={() => onOpenChange(false)}>
                  Run in background
                </Button>
                {reportId && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      onOpenChange(false);
                      router.push(`/reports/${reportId}`);
                    }}
                  >
                    Open report
                  </Button>
                )}
              </>
            )}
            {isDone && reportId && (
              <Button onClick={() => router.push(`/reports/${reportId}`)}>
                <FileText className="h-4 w-4" />
                View report
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getMinFor(step: "transcribe" | "fill" | "generate" | "done"): number {
  switch (step) {
    case "transcribe":
      return 30;
    case "fill":
      return 65;
    case "generate":
      return 90;
    case "done":
      return 100;
  }
}

