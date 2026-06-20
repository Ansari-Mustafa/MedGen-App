"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Download, Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  getTemplate,
  getTemplateDownload,
  setDefaultTemplate,
  updateTemplate,
} from "@/lib/api/endpoints/templates";
import { qk } from "@/lib/api/query-keys";
import { extractApiError } from "@/lib/utils/errors";
import { humanize } from "@/components/reports/report-fields";

export default function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: qk.templates.detail(id),
    queryFn: () => getTemplate(id),
  });

  const update = useMutation({
    mutationFn: (payload: Parameters<typeof updateTemplate>[1]) =>
      updateTemplate(id, payload),
    onSuccess: (t) => {
      qc.setQueryData(qk.templates.detail(id), t);
      qc.invalidateQueries({ queryKey: qk.templates.list() });
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const setDefault = useMutation({
    mutationFn: () => setDefaultTemplate(id),
    onSuccess: (t) => {
      qc.setQueryData(qk.templates.detail(id), t);
      qc.invalidateQueries({ queryKey: qk.templates.list() });
      toast.success("Default template updated");
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const download = useMutation({
    mutationFn: () => getTemplateDownload(id),
    onSuccess: ({ url }) => window.open(url, "_blank", "noopener,noreferrer"),
    onError: (err) => toast.error(extractApiError(err)),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data) return null;

  const placeholders = data.placeholders ?? {};
  const placeholderEntries = Object.entries(placeholders);

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/templates"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to templates
      </Link>

      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            {data.name}
            {data.is_default && (
              <Badge variant="success">
                <Star className="h-3 w-3" /> Default
              </Badge>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">
            {placeholderEntries.length} field
            {placeholderEntries.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setDefault.mutate()}
            disabled={data.is_default || setDefault.isPending}
          >
            <Star className="h-4 w-4" /> Set default
          </Button>
          <Button
            variant="outline"
            onClick={() => download.mutate()}
            disabled={download.isPending}
          >
            {download.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download
          </Button>
        </div>
      </header>

      <Card>
        <CardContent className="flex items-center justify-between gap-3 p-5">
          <div>
            <p className="text-sm font-medium">Active</p>
            <p className="text-xs text-muted-foreground">
              Inactive templates won&apos;t appear in the recording flow.
            </p>
          </div>
          <Switch
            checked={data.is_active}
            onCheckedChange={(v) => update.mutate({ is_active: v })}
          />
        </CardContent>
      </Card>

      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Fields
        </h2>
        {placeholderEntries.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              No fields detected.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col divide-y divide-border p-0">
              {placeholderEntries.map(([key, meta]) => (
                <div key={key} className="flex flex-col gap-1 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">{humanize(key)}</span>
                    <Badge variant="secondary">{meta.type ?? "text"}</Badge>
                  </div>
                  {meta.description && (
                    <span className="text-xs text-muted-foreground">
                      {meta.description}
                    </span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
