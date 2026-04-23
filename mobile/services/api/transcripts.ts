import { api } from '@/lib/api';
import type { Transcript, TranscriptListItem } from '@/types/models';

export interface TranscriptAudioUrl {
  url: string;
  expires_in: number;
}

export const getTranscripts = (): Promise<TranscriptListItem[]> =>
  api.get('/transcripts').then((r) => r.data);

export const getTranscript = (
  id: string,
  options: { includeAudioUrl?: boolean } = {},
): Promise<Transcript> =>
  api
    .get(`/transcripts/${id}`, {
      params: options.includeAudioUrl ? { include_audio_url: true } : undefined,
    })
    .then((r) => r.data);

export const getTranscriptAudioUrl = (id: string): Promise<TranscriptAudioUrl> =>
  api.get(`/transcripts/${id}/audio-url`).then((r) => r.data);
