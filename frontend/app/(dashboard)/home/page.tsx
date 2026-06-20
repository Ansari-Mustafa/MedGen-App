"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  ClipboardList,
  FileText,
  Mic,
  TrendingUp,
  Users,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { qk } from "@/lib/api/query-keys";
import { getDashboard } from "@/lib/api/endpoints/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/stat-card";
import { ReportStatusBadge } from "@/components/reports/report-status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  formatAppointmentTime,
  formatRelative,
  getAvatarColor,
  getGreeting,
  getInitials,
} from "@/lib/utils/format";

export default function HomePage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useQuery({
    queryKey: qk.dashboard,
    queryFn: getDashboard,
  });

  const firstName = user?.full_name?.split(" ")[0] ?? "there";

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">{getGreeting()},</p>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {firstName}
        </h1>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {isLoading ? (
          <>
            <Skeleton className="h-24 md:h-28" />
            <Skeleton className="h-24 md:h-28" />
            <Skeleton className="h-24 md:h-28" />
            <Skeleton className="h-24 md:h-28" />
          </>
        ) : (
          <>
            <StatCard
              label="Patients"
              value={data?.total_patients ?? 0}
              icon={Users}
              tone="primary"
            />
            <StatCard
              label="This month"
              value={data?.reports_this_month ?? 0}
              icon={TrendingUp}
              tone="success"
            />
            <StatCard
              label="Total reports"
              value={data?.total_reports ?? 0}
              icon={FileText}
              tone="info"
            />
            <StatCard
              label="Upcoming"
              value={data?.upcoming_appointments ?? 0}
              icon={CalendarDays}
              tone="warning"
            />
          </>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Quick actions
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <ActionCard href="/record" icon={Mic} label="Record" tone="primary" />
          <ActionCard href="/patients" icon={Users} label="Patients" tone="success" />
          <ActionCard href="/reports" icon={FileText} label="Reports" tone="info" />
          <ActionCard
            href="/appointments"
            icon={CalendarDays}
            label="Schedule"
            tone="warning"
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 py-4">
            <CardTitle className="text-base">Recent reports</CardTitle>
            <Link
              href="/reports"
              className="text-xs font-medium text-primary hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-0">
            {isLoading ? (
              <ReportsSkeleton />
            ) : data?.recent_reports.length ? (
              data.recent_reports.slice(0, 5).map((r) => (
                <Link
                  key={r.id}
                  href={`/reports/${r.id}`}
                  className="flex items-center gap-3 rounded-lg border border-transparent p-2 transition-colors hover:bg-surface-2 hover:border-border"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback
                      style={{ backgroundColor: getAvatarColor(r.patient_name) }}
                    >
                      {getInitials(r.patient_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium">
                      {r.patient_name ?? "Unknown patient"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatRelative(r.created_at)}
                    </span>
                  </div>
                  <ReportStatusBadge status={r.status} />
                </Link>
              ))
            ) : (
              <EmptyState
                icon={ClipboardList}
                message="No reports yet. Start a recording to generate one."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 py-4">
            <CardTitle className="text-base">Upcoming appointments</CardTitle>
            <Link
              href="/appointments"
              className="text-xs font-medium text-primary hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-0">
            {isLoading ? (
              <ReportsSkeleton />
            ) : data?.upcoming_appointments_list.length ? (
              data.upcoming_appointments_list.slice(0, 5).map((a) => (
                <Link
                  key={a.id}
                  href={`/appointments/${a.id}`}
                  className="flex items-center gap-3 rounded-lg border border-transparent p-2 transition-colors hover:bg-surface-2 hover:border-border"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-primary">
                    <CalendarDays className="h-4 w-4" />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium">
                      {a.patient_name ?? "Unknown patient"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatAppointmentTime(a.scheduled_at)}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <EmptyState
                icon={CalendarDays}
                message="No upcoming appointments scheduled."
              />
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function ActionCard({
  href,
  icon: Icon,
  label,
  tone,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  tone: "primary" | "success" | "warning" | "info";
}) {
  const tones = {
    primary: "bg-primary-soft text-primary",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    info: "bg-info-soft text-info",
  };
  return (
    <Link
      href={href}
      className="group flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-sm"
    >
      <span className={`grid h-10 w-10 place-items-center rounded-lg ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}

function ReportsSkeleton() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3 p-2">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </>
  );
}

function EmptyState({
  icon: Icon,
  message,
}: {
  icon: React.ComponentType<{ className?: string }>;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-surface-2 text-muted-foreground">
        <Icon className="h-5 w-5" />
      </span>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
