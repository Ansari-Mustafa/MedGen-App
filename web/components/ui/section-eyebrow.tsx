import { cn } from "@/lib/cn";

export function SectionEyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.14em] text-text-muted",
        className,
      )}
    >
      <span className="h-px w-6 bg-border-strong" aria-hidden />
      {children}
    </div>
  );
}
