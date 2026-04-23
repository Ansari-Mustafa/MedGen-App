import axios from 'axios';

import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import type { DoctorTemplate } from '@/types/models';

export type Template = DoctorTemplate;

export interface TemplatePatch {
  name?: string;
  is_active?: boolean;
}

export interface OnboardResult {
  template_id: string;
  job_id: string;
  status: string;
}

export interface OnboardingJob {
  id: string;
  template_id: string;
  status: 'pending' | 'running' | 'done' | 'error';
  step: string | null;
  error: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

export interface OnboardFile {
  uri: string;
  name: string;
  mimeType?: string | null;
}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

export const getTemplates = (): Promise<Template[]> =>
  api.get('/templates').then((r) => r.data);

export const getTemplate = (id: string): Promise<Template> =>
  api.get(`/templates/${id}`).then((r) => r.data);

export const updateTemplate = (id: string, patch: TemplatePatch): Promise<Template> =>
  api.patch(`/templates/${id}`, patch).then((r) => r.data);

export const setDefaultTemplate = (id: string): Promise<Template> =>
  api.post(`/templates/${id}/set-default`).then((r) => r.data);

export const deleteTemplate = (id: string): Promise<void> =>
  api.delete(`/templates/${id}`).then(() => undefined);

export const getOnboardingJob = (jobId: string): Promise<OnboardingJob> =>
  api.get(`/templates/onboard/${jobId}`).then((r) => r.data);

export const getTemplateDownloadUrl = (
  id: string,
): Promise<{ url: string; format: string }> =>
  api.get(`/templates/${id}/download`).then((r) => r.data);

export async function createTemplateFromPastReports(
  name: string,
  files: OnboardFile[],
): Promise<OnboardResult> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  const form = new FormData();
  form.append('name', name);
  files.forEach((file) => {
    form.append('files', {
      uri: file.uri,
      name: file.name,
      type:
        file.mimeType ??
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    } as unknown as Blob);
  });

  const res = await axios.post(`${API_BASE_URL}/templates/onboard`, form, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${token}`,
    },
    timeout: 180_000,
  });
  return res.data;
}
