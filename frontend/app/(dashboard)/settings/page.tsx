"use client";

import { useTheme } from "next-themes";
import { Monitor, Moon, Sun, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/stores/auth-store";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Customise your MedGen experience.
        </p>
      </header>

      <Card>
        <CardContent className="flex flex-col gap-4 p-5">
          <h2 className="text-sm font-medium text-muted-foreground">Appearance</h2>
          <div className="grid grid-cols-3 gap-2">
            <ThemeOption
              label="Light"
              icon={Sun}
              active={theme === "light"}
              onClick={() => setTheme("light")}
            />
            <ThemeOption
              label="Dark"
              icon={Moon}
              active={theme === "dark"}
              onClick={() => setTheme("dark")}
            />
            <ThemeOption
              label="System"
              icon={Monitor}
              active={theme === "system"}
              onClick={() => setTheme("system")}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Sign out</p>
              <p className="text-xs text-muted-foreground">
                You&apos;ll need to sign in again on this device.
              </p>
            </div>
            <Button
              variant="outline"
              className="text-error hover:text-error"
              onClick={() => logout()}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ThemeOption({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={
        active
          ? "flex flex-col items-center gap-1.5 rounded-lg border-2 border-primary bg-primary-soft px-3 py-3 text-sm font-medium text-primary"
          : "flex flex-col items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-surface-2"
      }
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
