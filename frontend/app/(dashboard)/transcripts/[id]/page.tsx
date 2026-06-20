"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AudioPlayer } from "@/components/audio-player";
import { getTranscript } from "@/lib/api/endpoints/transcripts";
import { qk } from "@/lib/api/query-keys";
import {
  formatDuration,
  formatRelative,
  getAvatarColor,
  getInitials,
} from "@/lib/utils/format";

export default function TranscriptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, isLoading } = useQuery({
    queryKey: qk.transcripts.detail(id),
    queryFn: () => getTranscript(id, true),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/transcripts"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback
              style={{ backgroundColor: getAvatarColor(data.patient_name) }}
            >
              {getInitials(data.patient_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              {data.patient_name ?? "Unknown patient"}
            </h1>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary">{data.provider}</Badge>
              {formatRelative(data.created_at)}
              {data.duration_s ? ` · ${formatDuration(data.duration_s)}` : ""}
            </p>
          </div>
        </div>
      </header>

      {data.audio_url && <AudioPlayer src={data.audio_url} />}

      <Card>
        <CardContent className="p-5 md:p-6">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            Transcript
          </h2>
          {data.paragraphs_text ? (
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {data.paragraphs_text}
            </div>
          ) : data.utterances_text ? (
            <div className="whitespace-pre-wrap font-mono text-xs leading-relaxed">
              {data.utterances_text}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No transcript text.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
