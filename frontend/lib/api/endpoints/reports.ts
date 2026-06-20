import { api } from "@/lib/api/client";
import type { MedicalReport } from "@/types/models";

export async function listReports(): Promise<MedicalReport[]> {
  const { data } = await api.get<MedicalReport[]>("/reports");
  return data;
}

export async function getReport(id: string): Promise<MedicalReport> {
  const { data } = await api.get<MedicalReport>(`/reports/${id}`);
  return data;
}

export async function patchReportFields(
  id: string,
  fields: Record<string, unknown>
): Promise<MedicalReport> {
  const { data } = await api.patch<MedicalReport>(`/reports/${id}/fields`, {
    fields,
  });
  return data;
}

export async function approveReport(id: string): Promise<MedicalReport> {
  const { data } = await api.post<MedicalReport>(`/reports/${id}/approve`);
  return data;
}

export async function getReportDownload(
  id: string,
  format: "docx" | "pdf" = "docx"
): Promise<{ url: string; format: string }> {
  const { data } = await api.get<{ url: string; format: string }>(
    `/reports/${id}/download`,
    { params: { format } }
  );
  return data;
}
