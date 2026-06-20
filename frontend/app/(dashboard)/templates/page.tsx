"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ClipboardList,
  Download,
  MoreHorizontal,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  deleteTemplate,
  getTemplateDownload,
  listTemplates,
  setDefaultTemplate,
  updateTemplate,
} from "@/lib/api/endpoints/templates";
import { qk } from "@/lib/api/query-keys";
import { extractApiError } from "@/lib/utils/errors";
import { useAuthStore } from "@/stores/auth-store";
import { canManageTemplates } from "@/lib/utils/role";
import type { DoctorTemplate } from "@/types/models";
import { useState } from "react";

export default function TemplatesPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: qk.templates.list(),
    queryFn: listTemplates,
    enabled: canManageTemplates(user),
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateTemplate>[1] }) =>
      updateTemplate(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.templates.list() });
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const setDefault = useMutation({
    mutationFn: (id: string) => setDefaultTemplate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.templates.list() });
      toast.success("Default template updated");
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteTemplate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.templates.list() });
      toast.success("Template deleted");
    },
    onError: (err) => toast.error(extractApiError(err, "Could not delete template")),
  });

  const download = useMutation({
    mutationFn: (id: string) => getTemplateDownload(id),
    onSuccess: ({ url }) => window.open(url, "_blank", "noopener,noreferrer"),
    onError: (err) => toast.error(extractApiError(err)),
  });

  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (!canManageTemplates(user)) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-muted-foreground">
          <ClipboardList className="h-5 w-5" />
        </span>
        <p className="text-sm font-medium">Templates are managed by doctors</p>
        <p className="text-xs text-muted-foreground">
          Ask the doctor in your practice to create or update templates.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Templates</h1>
          <p className="text-sm text-muted-foreground">
            Reports are generated from these templates and your writing style.
          </p>
        </div>
        <Button asChild>
          <Link href="/templates/new">
            <Plus className="h-4 w-4" /> Upload past reports
          </Link>
        </Button>
      </header>

      {isLoading ? (
        <ListSkeleton />
      ) : data && data.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {data.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              onActiveToggle={(v) =>
                update.mutate({ id: t.id, payload: { is_active: v } })
              }
              onSetDefault={() => setDefault.mutate(t.id)}
              onDownload={() => download.mutate(t.id)}
              onView={() => router.push(`/templates/${t.id}`)}
              onDelete={() => setDeleteId(t.id)}
            />
          ))}
        </div>
      ) : (
        <Empty />
      )}

      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(v) => !v && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this template?</AlertDialogTitle>
            <AlertDialogDescription>
              This is permanent. Reports already generated from this template
              will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) remove.mutate(deleteId);
                setDeleteId(null);
              }}
              className="bg-error text-white hover:bg-error/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TemplateCard({
  template,
  onActiveToggle,
  onSetDefault,
  onDownload,
  onView,
  onDelete,
}: {
  template: DoctorTemplate;
  onActiveToggle: (v: boolean) => void;
  onSetDefault: () => void;
  onDownload: () => void;
  onView: () => void;
  onDelete: () => void;
}) {
  const isOnboarding =
    template.onboarding_status === "pending" ||
    template.onboarding_status === "running";
  const isError = template.onboarding_status === "error";
  const placeholderCount = template.placeholders
    ? Object.keys(template.placeholders).length
    : 0;

  return (
    <Card className="transition-all hover:border-border-strong hover:shadow-sm">
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <button onClick={onView} className="flex flex-1 min-w-0 flex-col text-left">
            <span className="flex items-center gap-2">
              <span className="truncate text-base font-semibold">
                {template.name}
              </span>
              {template.is_default && (
                <Badge variant="success">
                  <Star className="h-3 w-3" /> Default
                </Badge>
              )}
              {isOnboarding && <Badge variant="info">Processing</Badge>}
              {isError && <Badge variant="error">Failed</Badge>}
              {!template.is_active && !isOnboarding && (
                <Badge variant="secondary">Inactive</Badge>
              )}
            </span>
            <span className="text-xs text-muted-foreground">
              {placeholderCount} field{placeholderCount === 1 ? "" : "s"}
            </span>
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="More">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onSetDefault} disabled={template.is_default}>
                <Star className="h-4 w-4" /> Set as default
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDownload}>
                <Download className="h-4 w-4" /> Download .docx
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-error focus:text-error"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="text-xs text-muted-foreground">Active</span>
          <Switch
            checked={template.is_active}
            onCheckedChange={onActiveToggle}
            disabled={isOnboarding}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function ListSkeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {[0, 1, 2].map((i) => (
        <Card key={i}>
          <CardContent className="flex flex-col gap-3 p-5">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-3 w-1/4" />
            <Skeleton className="h-6 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function Empty() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-muted-foreground">
          <ClipboardList className="h-5 w-5" />
        </span>
        <p className="text-sm font-medium">No templates yet</p>
        <p className="max-w-sm text-xs text-muted-foreground">
          Upload 2-5 past reports and we&apos;ll build a template that matches
          your writing style.
        </p>
        <Button asChild size="sm">
          <Link href="/templates/new">
            <Plus className="h-4 w-4" /> Upload past reports
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
