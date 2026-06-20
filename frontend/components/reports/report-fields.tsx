"use client";

import { Plus, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export type FieldValue = string | string[];

export function humanize(key: string): string {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function unwrapLegacyFilledJson(
  json: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  if (!json) return {};
  if (
    "filled" in json &&
    typeof json.filled === "object" &&
    json.filled !== null &&
    !Array.isArray(json.filled)
  ) {
    return json.filled as Record<string, unknown>;
  }
  return json;
}

export function normaliseDraft(json: Record<string, unknown>): Record<string, FieldValue> {
  const out: Record<string, FieldValue> = {};
  const source = unwrapLegacyFilledJson(json);
  for (const [k, v] of Object.entries(source)) {
    if (Array.isArray(v)) {
      out[k] = v.map((x) => (typeof x === "string" ? x : JSON.stringify(x)));
    } else if (v === null || v === undefined) {
      out[k] = "";
    } else if (typeof v === "string") {
      out[k] = v;
    } else {
      out[k] = JSON.stringify(v);
    }
  }
  return out;
}

export function diffDraft(
  original: Record<string, unknown>,
  draft: Record<string, FieldValue>
): Record<string, FieldValue> {
  const changed: Record<string, FieldValue> = {};
  for (const key of Object.keys(draft)) {
    const before = JSON.stringify(original[key] ?? null);
    const after = JSON.stringify(draft[key] ?? null);
    if (before !== after) changed[key] = draft[key];
  }
  return changed;
}

export function ReportFieldString({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const isLong = value.length > 80 || value.includes("\n");
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {isLong ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={Math.min(8, Math.max(3, value.split("\n").length + 1))}
        />
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      )}
    </div>
  );
}

export function ReportFieldList({
  label,
  values,
  onChange,
  disabled,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  disabled?: boolean;
}) {
  const update = (i: number, v: string) => {
    const next = [...values];
    next[i] = v;
    onChange(next);
  };
  const remove = (i: number) => {
    const next = values.filter((_, idx) => idx !== i);
    onChange(next);
  };
  const add = () => onChange([...values, ""]);

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div className="flex flex-col gap-2">
        {values.map((v, i) => (
          <div key={i} className="flex items-start gap-2">
            <Textarea
              value={v}
              onChange={(e) => update(i, e.target.value)}
              disabled={disabled}
              rows={2}
              className="flex-1"
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => remove(i)}
              disabled={disabled}
              aria-label="Remove item"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      {!disabled && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={add}
          className="self-start"
        >
          <Plus className="h-4 w-4" />
          Add item
        </Button>
      )}
    </div>
  );
}
