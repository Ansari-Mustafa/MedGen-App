import axios from 'axios';
import { supabase } from '@/lib/supabase';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

export interface UploadRecordingParams {
  audioUri: string;
  appointmentId: string;
  templateId: string;
  source?: 'app_recorded' | 'uploaded';
  durationS?: number;
}

export interface UploadResult {
  recording_id: string;
  report_id: string;
  job_id: string;
  status: string;
}

export async function uploadRecording(params: UploadRecordingParams): Promise<UploadResult> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  const form = new FormData();
  form.append('appointment_id', params.appointmentId);
  form.append('template_id', params.templateId);
  form.append('source', params.source ?? 'app_recorded');
  if (params.durationS != null) form.append('duration_s', String(params.durationS));

  // React Native FormData file entry
  form.append('file', {
    uri: params.audioUri,
    type: 'audio/m4a',
    name: 'recording.m4a',
  } as unknown as Blob);

  const res = await axios.post(`${API_BASE_URL}/recordings/upload`, form, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${token}`,
    },
    timeout: 120_000,
  });
  return res.data;
}
