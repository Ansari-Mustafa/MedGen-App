"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Mic } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuthStore } from "@/stores/auth-store";
import {
  getMobilePrimaryNav,
  secondaryNav,
  accountNav,
  filterByRole,
} from "@/components/shell/nav-config";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function BottomNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const navItems = getMobilePrimaryNav();

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur-md",
        "pb-[env(safe-area-inset-bottom)]",
        className
      )}
    >
      <div className="relative grid h-16 grid-cols-5 items-center px-2">
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}

        <div className="flex items-center justify-center">
          <Link
            href="/record"
            aria-label="Record"
            className="grid h-14 w-14 -translate-y-3 place-items-center rounded-full bg-primary text-primary-fg shadow-lg shadow-primary/30 transition-transform active:scale-95"
          >
            <Mic className="h-6 w-6" />
          </Link>
        </div>

        {navItems.slice(2, 4).map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>

      <Sheet>
        <SheetTrigger asChild>
          <button
            aria-label="More menu"
            className="absolute right-2 top-2 rounded-full p-1.5 text-muted-foreground hover:text-foreground"
            style={{ display: "none" }}
          >
            <Menu className="h-5 w-5" />
          </button>
        </SheetTrigger>
      </Sheet>
    </nav>
  );
}

export function MoreSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const items = [...filterByRole(secondaryNav, user), ...accountNav];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-80 flex-col">
        <SheetHeader>
          <SheetTitle>More</SheetTitle>
          <SheetDescription>Settings, profile, and other tools.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4">
          <ul className="flex flex-col gap-1">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => onOpenChange(false)}
                    className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-surface-2"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <Separator className="my-4" />
          <Button
            variant="ghost"
            className="w-full justify-start text-error hover:text-error"
            onClick={async () => {
              onOpenChange(false);
              await logout();
            }}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
