import { api } from "@/lib/api/client";
import type { Transcript, TranscriptListItem } from "@/types/models";

export async function listTranscripts(params?: {
  patientId?: string;
  limit?: number;
  offset?: number;
}): Promise<TranscriptListItem[]> {
  const { data } = await api.get<TranscriptListItem[]>("/transcripts", {
    params: {
      patient_id: params?.patientId,
      limit: params?.limit ?? 50,
      offset: params?.offset ?? 0,
    },
  });
  return data;
}

export async function getTranscript(
  id: string,
  includeAudioUrl = false
): Promise<Transcript> {
  const { data } = await api.get<Transcript>(`/transcripts/${id}`, {
    params: { include_audio_url: includeAudioUrl },
  });
  return data;
}

export async function getTranscriptAudioUrl(
  id: string
): Promise<{ url: string; expires_in: number }> {
  const { data } = await api.get<{ url: string; expires_in: number }>(
    `/transcripts/${id}/audio-url`
  );
  return data;
}
