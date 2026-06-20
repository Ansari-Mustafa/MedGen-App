"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FileText, Search } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportStatusBadge } from "@/components/reports/report-status-badge";
import { listReports } from "@/lib/api/endpoints/reports";
import { qk } from "@/lib/api/query-keys";
import { formatRelative, getAvatarColor, getInitials } from "@/lib/utils/format";
import type { MedicalReport, ReportStatus } from "@/types/models";

type Filter = "all" | "pending" | "ready" | "approved";

const filters: { value: Filter; label: string; match?: ReportStatus[] }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending", match: ["pending", "generating"] },
  { value: "ready", label: "Ready", match: ["ready", "edited"] },
  { value: "approved", label: "Approved", match: ["approved"] },
];

export default function ReportsListPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: qk.reports.list(),
    queryFn: listReports,
  });

  const filtered = useMemo(() => {
    let items = data ?? [];
    const cfg = filters.find((f) => f.value === filter);
    if (cfg?.match) {
      items = items.filter((r) => cfg.match!.includes(r.status));
    }
    if (q) {
      const term = q.toLowerCase();
      items = items.filter((r) =>
        r.patient_name?.toLowerCase().includes(term)
      );
    }
    return items;
  }, [data, filter, q]);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">
          View and approve generated medical reports.
        </p>
      </header>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <TabsList>
            {filters.map((f) => (
              <TabsTrigger key={f.value} value={f.value}>
                {f.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="relative md:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by patient"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <TabsContent value={filter} className="mt-4">
          {isLoading ? (
            <ListSkeleton />
          ) : filtered.length === 0 ? (
            <EmptyReports />
          ) : (
            <div className="grid gap-3">
              {filtered.map((r) => (
                <ReportRow key={r.id} report={r} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ReportRow({ report }: { report: MedicalReport }) {
  return (
    <Link href={`/reports/${report.id}`} className="block">
      <Card className="transition-all hover:border-border-strong hover:shadow-sm">
        <CardContent className="flex items-center gap-4 p-4">
          <Avatar className="h-11 w-11">
            <AvatarFallback
              style={{ backgroundColor: getAvatarColor(report.patient_name) }}
            >
              {getInitials(report.patient_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-semibold">
              {report.patient_name ?? "Unknown patient"}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatRelative(report.created_at)}
            </span>
          </div>
          <ReportStatusBadge status={report.status} />
        </CardContent>
      </Card>
    </Link>
  );
}

function ListSkeleton() {
  return (
    <div className="grid gap-3">
      {[0, 1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="flex items-center gap-4 p-4">
            <Skeleton className="h-11 w-11 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-5 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyReports() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-muted-foreground">
          <FileText className="h-5 w-5" />
        </span>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">No reports yet</p>
          <p className="text-xs text-muted-foreground">
            Record a consultation to generate your first report.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
