"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Mic, Square, Pause, Play, Upload, Loader2, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AppointmentPicker } from "@/components/pickers/appointment-picker";
import { TemplatePicker } from "@/components/pickers/template-picker";
import { Waveform } from "@/components/recording/waveform";
import { UploadDropzone } from "@/components/recording/upload-dropzone";
import { PipelineOverlay } from "@/components/recording/pipeline-overlay";
import { useRecording } from "@/hooks/use-recording";
import { formatDuration } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

function RecordPageInner() {
  const searchParams = useSearchParams();
  const initialAppointmentId = searchParams.get("appointmentId");

  const [appointmentId, setAppointmentId] = useState<string | null>(initialAppointmentId);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [overlayOpen, setOverlayOpen] = useState(false);

  const recording = useRecording(appointmentId, templateId);

  useEffect(() => {
    if (recording.uploadResult && !overlayOpen) {
      setOverlayOpen(true);
    }
  }, [recording.uploadResult, overlayOpen]);

  const isBusy = recording.state === "recording" || recording.state === "paused";

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">New consultation</h1>
        <p className="text-sm text-muted-foreground">
          Record live or upload an audio file. We&apos;ll handle the rest.
        </p>
      </header>

      <div className="grid gap-3">
        <AppointmentPicker
          value={appointmentId}
          onChange={(id) => setAppointmentId(id)}
        />
        <TemplatePicker value={templateId} onChange={(id) => setTemplateId(id)} />
      </div>

      <Tabs defaultValue="record" className="w-full">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="record" className="flex-1 md:flex-initial">
            <Mic className="h-4 w-4" />
            Record
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex-1 md:flex-initial">
            <Upload className="h-4 w-4" />
            Upload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="record">
          <Card>
            <CardContent className="flex flex-col items-center gap-6 py-8">
              <div className="text-5xl font-semibold tabular-nums tracking-tight md:text-6xl">
                {formatDuration(recording.duration)}
              </div>

              <div className="h-20 w-full max-w-md">
                {recording.stream ? (
                  <Waveform
                    stream={recording.stream}
                    paused={recording.state === "paused"}
                    className="h-full w-full"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-xs text-muted-foreground">
                    {recording.state === "idle"
                      ? "Tap record to begin"
                      : recording.state === "uploading"
                      ? "Uploading…"
                      : ""}
                  </div>
                )}
              </div>

              {recording.state === "uploading" && (
                <div className="w-full max-w-md">
                  <Progress value={recording.uploadProgress} />
                  <p className="mt-1 text-center text-xs text-muted-foreground">
                    Uploading {recording.uploadProgress}%
                  </p>
                </div>
              )}

              {recording.error && (
                <div className="flex items-center gap-2 rounded-md border border-error/30 bg-error-soft px-3 py-2 text-sm text-error">
                  <AlertCircle className="h-4 w-4" />
                  {recording.error}
                </div>
              )}

              <div className="flex items-center gap-3">
                {recording.state === "idle" || recording.state === "error" ? (
                  <Button
                    size="xl"
                    onClick={recording.start}
                    disabled={!appointmentId || !templateId}
                    className="rounded-full px-8"
                  >
                    <Mic className="h-5 w-5" />
                    Start recording
                  </Button>
                ) : (
                  <>
                    {recording.canPause && (
                      <Button
                        variant="outline"
                        size="lg"
                        className="rounded-full"
                        onClick={
                          recording.state === "paused"
                            ? recording.resume
                            : recording.pause
                        }
                      >
                        {recording.state === "paused" ? (
                          <>
                            <Play className="h-4 w-4" />
                            Resume
                          </>
                        ) : (
                          <>
                            <Pause className="h-4 w-4" />
                            Pause
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      size="lg"
                      onClick={recording.finishAndUpload}
                      disabled={recording.state === "uploading"}
                      className="rounded-full"
                    >
                      {recording.state === "uploading" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Square className="h-4 w-4 fill-current" />
                      )}
                      Finish & generate
                    </Button>
                  </>
                )}
              </div>

              {isBusy && (
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className={cn("h-2 w-2 rounded-full", recording.state === "recording" ? "bg-error dot-pulse" : "bg-muted-foreground")} />
                  {recording.state === "recording" ? "Recording" : "Paused"}
                </span>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload">
          <Card>
            <CardContent className="py-6">
              <UploadDropzone
                onFile={(f) => recording.uploadFile(f)}
                disabled={
                  !appointmentId ||
                  !templateId ||
                  recording.state === "uploading"
                }
              />
              {recording.state === "uploading" && (
                <div className="mt-4">
                  <Progress value={recording.uploadProgress} />
                  <p className="mt-1 text-center text-xs text-muted-foreground">
                    Uploading {recording.uploadProgress}%
                  </p>
                </div>
              )}
              {recording.error && (
                <div className="mt-4 flex items-center gap-2 rounded-md border border-error/30 bg-error-soft px-3 py-2 text-sm text-error">
                  <AlertCircle className="h-4 w-4" />
                  {recording.error}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <PipelineOverlay
        reportId={recording.uploadResult?.report_id ?? null}
        open={overlayOpen}
        onOpenChange={(v) => {
          setOverlayOpen(v);
          if (!v) recording.reset();
        }}
      />
    </div>
  );
}

export default function RecordPage() {
  return (
    <Suspense fallback={null}>
      <RecordPageInner />
    </Suspense>
  );
}
