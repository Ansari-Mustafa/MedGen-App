import Image from "next/image";
import { cn } from "@/lib/cn";

export function Wordmark({
  className,
  size = 24,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src="/MedGen-logo.png"
        alt=""
        width={size}
        height={size}
        priority
        className="shrink-0 rounded-md"
        style={{ height: size, width: size }}
      />
      <span className="text-[17px] font-semibold tracking-tight text-text">
        MedGen
      </span>
    </span>
  );
}
