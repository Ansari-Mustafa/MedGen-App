import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function ComingSoon({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </header>
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-primary-soft text-primary">
            <Icon className="h-5 w-5" />
          </span>
          <p className="text-sm font-medium">Coming soon</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            We&apos;re working on this. Check back here, or use the mobile app for
            full functionality.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
