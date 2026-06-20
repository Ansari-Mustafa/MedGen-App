import { getAuthToken } from "@/lib/api/client";
import { env } from "@/lib/env";
import axios from "axios";
import type { RecordingUploadResult } from "@/types/models";

export interface UploadRecordingArgs {
  file: File;
  appointmentId: string;
  templateId: string;
  durationS?: number;
  source?: "app_recorded" | "uploaded";
  onUploadProgress?: (pct: number) => void;
}

export async function uploadRecording({
  file,
  appointmentId,
  templateId,
  durationS,
  source = "app_recorded",
  onUploadProgress,
}: UploadRecordingArgs): Promise<RecordingUploadResult> {
  const token = await getAuthToken();
  if (!token) throw new Error("Not authenticated");

  const formData = new FormData();
  formData.append("appointment_id", appointmentId);
  formData.append("template_id", templateId);
  formData.append("source", source);
  if (durationS != null) formData.append("duration_s", String(Math.round(durationS)));
  formData.append("file", file);

  const { data } = await axios.post<RecordingUploadResult>(
    `${env.API_BASE_URL}/recordings/upload`,
    formData,
    {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 120_000,
      onUploadProgress: (e) => {
        if (onUploadProgress && e.total) {
          onUploadProgress(Math.round((e.loaded / e.total) * 100));
        }
      },
    }
  );
  return data;
}
