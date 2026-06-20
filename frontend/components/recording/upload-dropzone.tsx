"use client";

import { useRef, useState } from "react";
import { Upload, FileAudio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export function UploadDropzone({
  onFile,
  disabled,
}: {
  onFile: (file: File) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const onSelect = () => inputRef.current?.click();

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        if (disabled) return;
        const file = e.dataTransfer.files?.[0];
        if (file) onFile(file);
      }}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors",
        drag
          ? "border-primary bg-primary-soft"
          : "border-border-strong bg-surface",
        disabled && "opacity-50 pointer-events-none"
      )}
    >
      <span className="grid h-12 w-12 place-items-center rounded-full bg-primary-soft text-primary">
        <FileAudio className="h-5 w-5" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">
          Drop audio file here, or click to browse
        </p>
        <p className="text-xs text-muted-foreground">
          MP3, WAV, M4A, WEBM, OGG up to 100 MB
        </p>
      </div>
      <Button onClick={onSelect} variant="outline" disabled={disabled}>
        <Upload className="h-4 w-4" />
        Browse files
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
