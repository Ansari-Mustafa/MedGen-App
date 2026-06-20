"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, FileText, Loader2, Sparkles, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { onboardTemplate } from "@/lib/api/endpoints/templates";
import { qk } from "@/lib/api/query-keys";
import { extractApiError } from "@/lib/utils/errors";
import { OnboardingProgress } from "@/components/templates/onboarding-progress";
import { cn } from "@/lib/utils/cn";

export default function NewTemplatePage() {
  const router = useRouter();
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [drag, setDrag] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);

  const onboard = useMutation({
    mutationFn: () => onboardTemplate(name.trim(), files),
    onSuccess: (res) => {
      setJobId(res.job_id);
      qc.invalidateQueries({ queryKey: qk.templates.list() });
    },
    onError: (err) => toast.error(extractApiError(err, "Could not start onboarding")),
  });

  const addFiles = (incoming: FileList | File[]) => {
    const list = Array.from(incoming).filter((f) =>
      f.name.toLowerCase().endsWith(".docx")
    );
    setFiles((cur) => [...cur, ...list].slice(0, 5));
  };

  const removeFile = (i: number) =>
    setFiles((cur) => cur.filter((_, idx) => idx !== i));

  const canSubmit = name.trim().length > 0 && files.length >= 2 && files.length <= 5;

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/templates"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to templates
      </Link>

      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Create a template</h1>
        <p className="text-sm text-muted-foreground">
          Upload 2 to 5 past reports as .docx files. We&apos;ll learn your writing
          style and produce a reusable template.
        </p>
      </header>

      {jobId ? (
        <>
          <OnboardingProgress jobId={jobId} />
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => router.replace("/templates")}>
              Done
            </Button>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col gap-5 p-5 md:p-6">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Template name</Label>
              <Input
                id="name"
                placeholder="Initial assessment"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(false);
                if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
              }}
              className={cn(
                "flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors",
                drag
                  ? "border-primary bg-primary-soft"
                  : "border-border-strong bg-surface"
              )}
            >
              <span className="grid h-12 w-12 place-items-center rounded-full bg-primary-soft text-primary">
                <FileText className="h-5 w-5" />
              </span>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">
                  Drop .docx reports here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  Between 2 and 5 files
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => inputRef.current?.click()}
                disabled={files.length >= 5}
              >
                <Upload className="h-4 w-4" /> Choose files
              </Button>
              <input
                ref={inputRef}
                type="file"
                multiple
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>

            {files.length > 0 && (
              <div className="flex flex-col gap-2">
                <Label>Selected files</Label>
                <ul className="flex flex-col gap-2">
                  {files.map((f, i) => (
                    <li
                      key={`${f.name}-${i}`}
                      className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 text-sm"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 truncate">{f.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {(f.size / 1024).toFixed(0)} KB
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="text-muted-foreground hover:text-error"
                        aria-label="Remove"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                onClick={() => onboard.mutate()}
                disabled={!canSubmit || onboard.isPending}
              >
                {onboard.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Build template
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
