import type { ReactNode } from "react";
import Link from "next/link";
import { Stethoscope } from "lucide-react";
import { APP_NAME } from "@/lib/env";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh w-full bg-bg">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(circle_at_top,_rgba(30,64,175,0.08),_transparent_60%)]"
      />
      <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-fg shadow-sm">
            <Stethoscope className="h-5 w-5" />
          </span>
          <span className="text-base tracking-tight">{APP_NAME}</span>
        </Link>
      </header>
      <main className="flex min-h-dvh items-center justify-center p-6">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
