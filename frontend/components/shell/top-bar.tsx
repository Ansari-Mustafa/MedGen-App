"use client";

import Link from "next/link";
import { useState } from "react";
import { Bell, LogOut, Menu, Stethoscope, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores/auth-store";
import { getAvatarColor, getInitials } from "@/lib/utils/format";
import { ThemeToggle } from "@/components/theme-toggle";
import { MoreSheet } from "@/components/shell/bottom-nav";
import { APP_NAME } from "@/lib/env";

export function TopBar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-card/80 px-4 backdrop-blur md:h-16 md:pl-6 md:pr-6">
      <div className="md:hidden flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-fg">
          <Stethoscope className="h-4 w-4" />
        </span>
        <span className="text-sm font-semibold">{APP_NAME}</span>
      </div>

      <div className="hidden md:block flex-1" />
      <div className="flex-1 md:hidden" />

      <div className="flex items-center gap-1">
        <ThemeToggle />

        <Button variant="ghost" size="icon" aria-label="Notifications" asChild>
          <Link href="/notifications">
            <Bell className="h-4 w-4" />
          </Link>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="More"
          onClick={() => setMoreOpen(true)}
        >
          <Menu className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarFallback
                  style={{ backgroundColor: getAvatarColor(user?.full_name) }}
                >
                  {getInitials(user?.full_name)}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {user && (
              <>
                <DropdownMenuLabel className="normal-case tracking-normal">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-foreground">
                      {user.full_name}
                    </span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem asChild>
              <Link href="/profile">
                <UserCircle className="h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-error focus:text-error"
              onClick={() => logout()}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} />
    </header>
  );
}
