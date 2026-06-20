import { api, getAuthToken } from "@/lib/api/client";
import { env } from "@/lib/env";
import axios from "axios";
import type { DoctorTemplate } from "@/types/models";

export async function listTemplates(): Promise<DoctorTemplate[]> {
  const { data } = await api.get<DoctorTemplate[]>("/templates");
  return data;
}

export async function getTemplate(id: string): Promise<DoctorTemplate> {
  const { data } = await api.get<DoctorTemplate>(`/templates/${id}`);
  return data;
}

export async function updateTemplate(
  id: string,
  payload: { name?: string; is_active?: boolean }
): Promise<DoctorTemplate> {
  const { data } = await api.patch<DoctorTemplate>(`/templates/${id}`, payload);
  return data;
}

export async function setDefaultTemplate(id: string): Promise<DoctorTemplate> {
  const { data } = await api.post<DoctorTemplate>(`/templates/${id}/set-default`);
  return data;
}

export async function deleteTemplate(id: string): Promise<void> {
  await api.delete(`/templates/${id}`);
}

export async function getTemplateDownload(
  id: string
): Promise<{ url: string; format: string }> {
  const { data } = await api.get<{ url: string; format: string }>(
    `/templates/${id}/download`
  );
  return data;
}

export interface OnboardingJobResult {
  template_id: string;
  job_id: string;
  status: string;
}

export async function onboardTemplate(
  name: string,
  files: File[]
): Promise<OnboardingJobResult> {
  const token = await getAuthToken();
  if (!token) throw new Error("Not authenticated");

  const formData = new FormData();
  formData.append("name", name);
  files.forEach((f) => formData.append("files", f));

  const { data } = await axios.post<OnboardingJobResult>(
    `${env.API_BASE_URL}/templates/onboard`,
    formData,
    {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 180_000,
    }
  );
  return data;
}

export interface OnboardingJob {
  id: string;
  template_id: string;
  status: "pending" | "running" | "done" | "error";
  step?: string;
  error?: string | null;
}

export async function getOnboardingJob(jobId: string): Promise<OnboardingJob> {
  const { data } = await api.get<OnboardingJob>(`/templates/onboard/${jobId}`);
  return data;
}
