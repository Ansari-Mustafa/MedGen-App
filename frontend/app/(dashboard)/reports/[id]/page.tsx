"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ReportStatusBadge } from "@/components/reports/report-status-badge";
import {
  diffDraft,
  humanize,
  normaliseDraft,
  ReportFieldList,
  ReportFieldString,
  unwrapLegacyFilledJson,
  type FieldValue,
} from "@/components/reports/report-fields";
import {
  approveReport,
  getReport,
  getReportDownload,
  patchReportFields,
} from "@/lib/api/endpoints/reports";
import { qk } from "@/lib/api/query-keys";
import { extractApiError } from "@/lib/utils/errors";
import { formatRelative, getAvatarColor, getInitials } from "@/lib/utils/format";

export default function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();

  const { data: report, isLoading } = useQuery({
    queryKey: qk.reports.detail(id),
    queryFn: () => getReport(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "pending" || status === "generating" ? 3000 : false;
    },
  });

  const isApproved = report?.status === "approved";
  const isGenerating =
    report?.status === "pending" || report?.status === "generating";

  const [draft, setDraft] = useState<Record<string, FieldValue>>({});
  const baselineRef = useRef<Record<string, unknown>>({});

  useEffect(() => {
    if (!report) return;
    baselineRef.current = unwrapLegacyFilledJson(report.filled_json ?? {});
    setDraft(normaliseDraft(report.filled_json ?? {}));
  }, [report?.id, report?.updated_at]);

  const isDirty = useMemo(() => {
    if (!report) return false;
    return Object.keys(diffDraft(baselineRef.current, draft)).length > 0;
  }, [draft, report]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const diff = diffDraft(baselineRef.current, draft);
      return patchReportFields(id, diff);
    },
    onSuccess: (updated) => {
      qc.setQueryData(qk.reports.detail(id), updated);
      qc.invalidateQueries({ queryKey: qk.reports.list() });
      toast.success("Changes saved");
    },
    onError: (err) => toast.error(extractApiError(err, "Save failed")),
  });

  const approveMutation = useMutation({
    mutationFn: () => approveReport(id),
    onSuccess: (updated) => {
      qc.setQueryData(qk.reports.detail(id), updated);
      qc.invalidateQueries({ queryKey: qk.reports.list() });
      toast.success("Report approved");
    },
    onError: (err) => toast.error(extractApiError(err, "Approve failed")),
  });

  const downloadMutation = useMutation({
    mutationFn: (format: "docx" | "pdf") => getReportDownload(id, format),
    onSuccess: ({ url }) => {
      window.open(url, "_blank", "noopener,noreferrer");
    },
    onError: (err) => toast.error(extractApiError(err, "Download failed")),
  });

  if (isLoading) return <DetailSkeleton />;

  if (!report) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <p className="text-sm text-muted-foreground">Report not found.</p>
        <Button variant="outline" onClick={() => router.back()}>
          Go back
        </Button>
      </div>
    );
  }

  const fieldKeys = Object.keys(draft);

  return (
    <div className="flex flex-col gap-5 pb-24">
      <header className="flex flex-col gap-3">
        <Link
          href="/reports"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to reports
        </Link>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback
                style={{ backgroundColor: getAvatarColor(report.patient_name) }}
              >
                {getInitials(report.patient_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <h1 className="text-xl font-semibold tracking-tight">
                {report.patient_name ?? "Unknown patient"}
              </h1>
              <span className="text-xs text-muted-foreground">
                Created {formatRelative(report.created_at)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ReportStatusBadge status={report.status} />
            {report.docx_path && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadMutation.mutate("docx")}
                disabled={downloadMutation.isPending}
              >
                <Download className="h-4 w-4" />
                DOCX
              </Button>
            )}
            {report.pdf_path && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadMutation.mutate("pdf")}
                disabled={downloadMutation.isPending}
              >
                <Download className="h-4 w-4" />
                PDF
              </Button>
            )}
          </div>
        </div>
      </header>

      {isApproved && (
        <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success-soft px-3 py-2 text-sm text-success">
          <Lock className="h-4 w-4" />
          This report has been approved and is locked.
        </div>
      )}

      {isGenerating && (
        <div className="flex items-center gap-2 rounded-lg border border-info/30 bg-info-soft px-3 py-2 text-sm text-info">
          <Loader2 className="h-4 w-4 animate-spin" />
          Report is still generating. Fields will appear when ready.
        </div>
      )}

      {fieldKeys.length === 0 && !isGenerating ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <FileText className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No fields available for this report.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:gap-4">
          {fieldKeys.map((key) => {
            const v = draft[key];
            if (Array.isArray(v)) {
              return (
                <Card key={key}>
                  <CardContent className="p-4 md:p-5">
                    <ReportFieldList
                      label={humanize(key)}
                      values={v}
                      onChange={(next) => setDraft((d) => ({ ...d, [key]: next }))}
                      disabled={isApproved}
                    />
                  </CardContent>
                </Card>
              );
            }
            return (
              <Card key={key}>
                <CardContent className="p-4 md:p-5">
                  <ReportFieldString
                    label={humanize(key)}
                    value={v}
                    onChange={(next) => setDraft((d) => ({ ...d, [key]: next }))}
                    disabled={isApproved}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!isApproved && fieldKeys.length > 0 && (
        <div className="fixed inset-x-0 bottom-16 z-20 border-t border-border bg-card/95 px-4 py-3 backdrop-blur md:bottom-0 md:left-64">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              {isDirty ? "Unsaved changes" : "All changes saved"}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  setDraft(normaliseDraft(report.filled_json ?? {}))
                }
                disabled={!isDirty || saveMutation.isPending}
              >
                Discard
              </Button>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={!isDirty || saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Save changes
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="default">
                    <ShieldCheck className="h-4 w-4" />
                    Approve
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Approve this report?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Once approved, fields will be locked. Save your changes
                      before approving — unsaved edits will be lost.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        if (isDirty) await saveMutation.mutateAsync();
                        approveMutation.mutate();
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Approve report
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}
