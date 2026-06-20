"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FileAudio, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { listTranscripts } from "@/lib/api/endpoints/transcripts";
import { qk } from "@/lib/api/query-keys";
import {
  formatDuration,
  formatRelative,
  getAvatarColor,
  getInitials,
} from "@/lib/utils/format";

export default function TranscriptsPage() {
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: qk.transcripts.list(),
    queryFn: () => listTranscripts(),
  });

  const filtered = useMemo(() => {
    const items = data ?? [];
    if (!q) return items;
    const term = q.toLowerCase();
    return items.filter(
      (t) =>
        t.patient_name?.toLowerCase().includes(term) ||
        t.snippet?.toLowerCase().includes(term)
    );
  }, [data, q]);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Transcripts</h1>
        <p className="text-sm text-muted-foreground">
          Recordings transcribed by AI, with original audio.
        </p>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search transcripts"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-muted-foreground">
              <FileAudio className="h-5 w-5" />
            </span>
            <p className="text-sm font-medium">No transcripts yet</p>
            <p className="text-xs text-muted-foreground">
              Record a consultation to generate a transcript.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((t) => (
            <Link key={t.id} href={`/transcripts/${t.id}`} className="block">
              <Card className="transition-all hover:border-border-strong hover:shadow-sm">
                <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
                  <Avatar className="h-11 w-11">
                    <AvatarFallback
                      style={{ backgroundColor: getAvatarColor(t.patient_name) }}
                    >
                      {getInitials(t.patient_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold">
                        {t.patient_name ?? "Unknown patient"}
                      </span>
                      <Badge variant="secondary">{t.provider}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatRelative(t.created_at)}
                      {t.duration_s ? ` · ${formatDuration(t.duration_s)}` : ""}
                    </span>
                    {t.snippet && (
                      <span className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {t.snippet}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
