import { useState, useRef, useEffect, useCallback } from 'react';
import { Audio } from 'expo-av';
import { uploadRecording, UploadResult } from '@/services/api/recordings';

export type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped' | 'uploading' | 'done' | 'error';

interface UseRecordingOptions {
  appointmentId?: string;
  templateId?: string;
}

interface UseRecordingReturn {
  state: RecordingState;
  duration: number;
  error: string | null;
  uploadResult: UploadResult | null;
  start: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  finishAndUpload: () => Promise<void>;
  uploadFile: (uri: string) => Promise<void>;
  reset: () => void;
}

export function useRecording({
  appointmentId,
  templateId,
}: UseRecordingOptions = {}): UseRecordingReturn {
  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
    };
  }, []);

  const startTimer = () => {
    timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const start = useCallback(async () => {
    setError(null);
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        setError('Microphone permission is required to record audio.');
        setState('error');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recordingRef.current = recording;
      setState('recording');
      setDuration(0);
      startTimer();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start recording');
      setState('error');
    }
  }, []);

  const pause = useCallback(async () => {
    if (!recordingRef.current || state !== 'recording') return;
    try {
      await recordingRef.current.pauseAsync();
      setState('paused');
      stopTimer();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to pause recording');
    }
  }, [state]);

  const resume = useCallback(async () => {
    if (!recordingRef.current || state !== 'paused') return;
    try {
      await recordingRef.current.startAsync();
      setState('recording');
      startTimer();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to resume recording');
    }
  }, [state]);

  const doUpload = useCallback(
    async (audioUri: string, source: 'app_recorded' | 'uploaded') => {
      if (!appointmentId || !templateId) {
        setError('Select an appointment and template before uploading.');
        setState('error');
        return;
      }

      setState('uploading');
      try {
        const result = await uploadRecording({
          audioUri,
          appointmentId,
          templateId,
          source,
          durationS: source === 'app_recorded' ? duration : undefined,
        });
        setUploadResult(result);
        setState('done');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Upload failed');
        setState('error');
      }
    },
    [appointmentId, templateId, duration],
  );

  const finishAndUpload = useCallback(async () => {
    if (!recordingRef.current) return;
    stopTimer();
    try {
      await recordingRef.current.stopAndUnloadAsync();
    } catch {
      // ignore stop errors
    }
    const uri = recordingRef.current.getURI();
    recordingRef.current = null;
    setState('stopped');
    if (uri) await doUpload(uri, 'app_recorded');
  }, [doUpload]);

  const uploadFile = useCallback(
    async (uri: string) => {
      await doUpload(uri, 'uploaded');
    },
    [doUpload],
  );

  const reset = useCallback(() => {
    stopTimer();
    recordingRef.current?.stopAndUnloadAsync().catch(() => {});
    recordingRef.current = null;
    setState('idle');
    setDuration(0);
    setError(null);
    setUploadResult(null);
  }, []);

  return { state, duration, error, uploadResult, start, pause, resume, finishAndUpload, uploadFile, reset };
}
