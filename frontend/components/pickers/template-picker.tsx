"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown, ClipboardList, Search } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { listTemplates } from "@/lib/api/endpoints/templates";
import { qk } from "@/lib/api/query-keys";
import { cn } from "@/lib/utils/cn";
import type { DoctorTemplate } from "@/types/models";

export function TemplatePicker({
  value,
  onChange,
  autoSelectDefault = true,
}: {
  value: string | null;
  onChange: (id: string, template: DoctorTemplate) => void;
  autoSelectDefault?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: qk.templates.list(),
    queryFn: listTemplates,
  });

  const filtered = useMemo(() => {
    const items = (data ?? []).filter(
      (t) => t.is_active && t.onboarding_status === "ready"
    );
    if (!q) return items;
    const term = q.toLowerCase();
    return items.filter((t) => t.name.toLowerCase().includes(term));
  }, [data, q]);

  useEffect(() => {
    if (!autoSelectDefault || value || !data) return;
    const def = data.find((t) => t.is_default && t.is_active);
    if (def) onChange(def.id, def);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSelectDefault, value, data]);

  const selected = (data ?? []).find((t) => t.id === value);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-3.5 py-3 text-left transition-colors hover:bg-surface-2"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-info-soft text-info">
            <ClipboardList className="h-4 w-4" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-xs font-medium text-muted-foreground">Template</span>
            <span className="truncate text-sm font-medium">
              {selected ? selected.name : "Select a template"}
            </span>
          </div>
          {selected?.is_default && <Badge variant="success">Default</Badge>}
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Select template</SheetTitle>
          <SheetDescription>
            Choose which template this report should follow.
          </SheetDescription>
        </SheetHeader>
        <div className="border-b border-border p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search templates"
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <p className="p-4 text-sm text-muted-foreground">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              No active templates yet. Create one in Templates.
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {filtered.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(t.id, t);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-surface-2",
                      value === t.id && "bg-primary-soft"
                    )}
                  >
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium">{t.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {t.placeholders ? Object.keys(t.placeholders).length : 0} fields
                      </span>
                    </div>
                    {t.is_default && <Badge variant="success">Default</Badge>}
                    {value === t.id && <Check className="h-4 w-4 text-primary" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
