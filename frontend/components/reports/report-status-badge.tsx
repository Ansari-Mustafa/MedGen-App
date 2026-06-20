import { Badge } from "@/components/ui/badge";
import type { ReportStatus } from "@/types/models";

const config: Record<
  ReportStatus,
  { label: string; variant: "default" | "success" | "warning" | "error" | "info" | "secondary" }
> = {
  pending: { label: "Pending", variant: "secondary" },
  generating: { label: "Generating", variant: "info" },
  ready: { label: "Ready", variant: "warning" },
  edited: { label: "Edited", variant: "warning" },
  approved: { label: "Approved", variant: "success" },
  error: { label: "Error", variant: "error" },
};

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  const c = config[status] ?? { label: status, variant: "secondary" as const };
  return <Badge variant={c.variant}>{c.label}</Badge>;
}
