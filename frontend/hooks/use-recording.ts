"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserRecorder } from "@/lib/audio/recorder";
import { uploadRecording } from "@/lib/api/endpoints/recordings";
import { extractApiError } from "@/lib/utils/errors";
import type { RecordingUploadResult } from "@/types/models";

export type RecordingState =
  | "idle"
  | "recording"
  | "paused"
  | "stopped"
  | "uploading"
  | "done"
  | "error";

export function useRecording(appointmentId: string | null, templateId: string | null) {
  const recorderRef = useRef<BrowserRecorder | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [state, setState] = useState<RecordingState>("idle");
  const [duration, setDuration] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<RecordingUploadResult | null>(null);

  const startTick = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      setDuration((d) => d + 1);
    }, 1000);
  }, []);

  const stopTick = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopTick();
      recorderRef.current?.cancel();
    };
  }, [stopTick]);

  const start = useCallback(async () => {
    setError(null);
    if (!BrowserRecorder.isSupported()) {
      setError("Audio recording is not supported in this browser.");
      setState("error");
      return;
    }
    try {
      const recorder = new BrowserRecorder();
      const ms = await recorder.start();
      recorderRef.current = recorder;
      setStream(ms);
      setDuration(0);
      setState("recording");
      startTick();
    } catch (e) {
      setError(extractApiError(e, "Could not start recording. Please grant microphone access."));
      setState("error");
    }
  }, [startTick]);

  const pause = useCallback(() => {
    recorderRef.current?.pause();
    stopTick();
    setState("paused");
  }, [stopTick]);

  const resume = useCallback(() => {
    recorderRef.current?.resume();
    setState("recording");
    startTick();
  }, [startTick]);

  const finishAndUpload = useCallback(async () => {
    if (!appointmentId || !templateId) {
      setError("Select an appointment and a template first.");
      return;
    }
    const recorder = recorderRef.current;
    if (!recorder) return;

    stopTick();
    setState("uploading");
    setUploadProgress(0);

    try {
      const result = await recorder.stop();
      setStream(null);
      const file = new File([result.blob], `recording.${result.extension}`, {
        type: result.mimeType,
      });
      const upload = await uploadRecording({
        file,
        appointmentId,
        templateId,
        durationS: result.durationS,
        source: "app_recorded",
        onUploadProgress: setUploadProgress,
      });
      setUploadResult(upload);
      setState("done");
    } catch (e) {
      setError(extractApiError(e, "Upload failed. Please try again."));
      setState("error");
    }
  }, [appointmentId, templateId, stopTick]);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!appointmentId || !templateId) {
        setError("Select an appointment and a template first.");
        return;
      }
      setState("uploading");
      setUploadProgress(0);
      setError(null);
      try {
        const upload = await uploadRecording({
          file,
          appointmentId,
          templateId,
          source: "uploaded",
          onUploadProgress: setUploadProgress,
        });
        setUploadResult(upload);
        setState("done");
      } catch (e) {
        setError(extractApiError(e, "Upload failed. Please try again."));
        setState("error");
      }
    },
    [appointmentId, templateId]
  );

  const reset = useCallback(() => {
    stopTick();
    recorderRef.current?.cancel();
    recorderRef.current = null;
    setStream(null);
    setDuration(0);
    setUploadProgress(0);
    setUploadResult(null);
    setError(null);
    setState("idle");
  }, [stopTick]);

  return {
    state,
    duration,
    stream,
    error,
    uploadProgress,
    uploadResult,
    start,
    pause,
    resume,
    finishAndUpload,
    uploadFile,
    reset,
    canPause: BrowserRecorder.supportsPause(),
  };
}
