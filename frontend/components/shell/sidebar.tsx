"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { useAuthStore } from "@/stores/auth-store";
import {
  primaryNav,
  secondaryNav,
  accountNav,
  filterByRole,
  BrandIcon,
} from "@/components/shell/nav-config";
import { APP_NAME } from "@/lib/env";
import { Separator } from "@/components/ui/separator";

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 w-64 border-r border-border bg-card",
        className
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center gap-2 px-5 border-b border-border">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-fg shadow-sm">
            <BrandIcon className="h-5 w-5" />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-base font-semibold tracking-tight">{APP_NAME}</span>
            <span className="text-xs text-muted-foreground">Medical AI</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <NavGroup>
            {primaryNav.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={isActive(item.href)}
              />
            ))}
          </NavGroup>

          <Separator className="my-4" />

          <NavLabel>Manage</NavLabel>
          <NavGroup>
            {filterByRole(secondaryNav, user).map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={isActive(item.href)}
              />
            ))}
          </NavGroup>

          <Separator className="my-4" />

          <NavLabel>Account</NavLabel>
          <NavGroup>
            {accountNav.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={isActive(item.href)}
              />
            ))}
          </NavGroup>
        </nav>
      </div>
    </aside>
  );
}

function NavGroup({ children }: { children: React.ReactNode }) {
  return <ul className="flex flex-col gap-1">{children}</ul>;
}

function NavLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  );
}

function NavLink({
  item,
  active,
}: {
  item: { label: string; href: string; icon: React.ComponentType<{ className?: string }> };
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <li>
      <Link
        href={item.href}
        className={cn(
          "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          active
            ? "bg-primary-soft text-primary"
            : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {item.label}
      </Link>
    </li>
  );
}
