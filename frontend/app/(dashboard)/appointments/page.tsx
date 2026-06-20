"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { isAfter, isToday, parseISO } from "date-fns";
import { CalendarDays, Mic, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { listAppointments } from "@/lib/api/endpoints/appointments";
import { qk } from "@/lib/api/query-keys";
import { formatAppointmentTime } from "@/lib/utils/format";
import type { Appointment } from "@/types/models";

type Filter = "today" | "upcoming" | "all";

export default function AppointmentsPage() {
  const [filter, setFilter] = useState<Filter>("upcoming");
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: qk.appointments.list(),
    queryFn: listAppointments,
  });

  const filtered = useMemo(() => {
    let items = data ?? [];
    const now = new Date();
    if (filter === "today") {
      items = items.filter(
        (a) => a.scheduled_at && isToday(parseISO(a.scheduled_at))
      );
    } else if (filter === "upcoming") {
      items = items.filter(
        (a) => a.scheduled_at && isAfter(parseISO(a.scheduled_at), now)
      );
    }
    if (q) {
      const term = q.toLowerCase();
      items = items.filter(
        (a) =>
          a.patient_name?.toLowerCase().includes(term) ||
          a.type?.toLowerCase().includes(term)
      );
    }
    return items;
  }, [data, filter, q]);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Appointments</h1>
          <p className="text-sm text-muted-foreground">
            Plan, view, and record consultations.
          </p>
        </div>
        <Button asChild>
          <Link href="/appointments/new">
            <Plus className="h-4 w-4" /> New appointment
          </Link>
        </Button>
      </header>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <TabsList>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
          <div className="relative md:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by patient or type"
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
            <Empty />
          ) : (
            <div className="grid gap-3">
              {filtered.map((a) => (
                <AppointmentRow key={a.id} appointment={a} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AppointmentRow({ appointment }: { appointment: Appointment }) {
  return (
    <Card className="transition-all hover:border-border-strong hover:shadow-sm">
      <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
        <Link
          href={`/appointments/${appointment.id}`}
          className="flex flex-1 items-center gap-3"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
            <CalendarDays className="h-4 w-4" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-semibold">
              {appointment.patient_name ?? "Unknown patient"}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatAppointmentTime(appointment.scheduled_at)}
              {appointment.type ? ` · ${appointment.type}` : ""}
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <StatusBadge status={appointment.status} />
          <Button asChild size="sm" variant="outline">
            <Link href={`/record?appointmentId=${appointment.id}`}>
              <Mic className="h-3.5 w-3.5" />
              Record
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: Appointment["status"] }) {
  const map: Record<
    Appointment["status"],
    { label: string; variant: "default" | "success" | "warning" | "error" | "secondary" }
  > = {
    scheduled: { label: "Scheduled", variant: "default" },
    completed: { label: "Completed", variant: "success" },
    cancelled: { label: "Cancelled", variant: "error" },
  };
  const c = map[status];
  return <Badge variant={c.variant}>{c.label}</Badge>;
}

function ListSkeleton() {
  return (
    <div className="grid gap-3">
      {[0, 1, 2].map((i) => (
        <Card key={i}>
          <CardContent className="flex items-center gap-4 p-4">
            <Skeleton className="h-11 w-11 rounded-lg" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-8 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function Empty() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-muted-foreground">
          <CalendarDays className="h-5 w-5" />
        </span>
        <p className="text-sm font-medium">No appointments to show</p>
        <Button asChild size="sm" variant="outline">
          <Link href="/appointments/new">
            <Plus className="h-4 w-4" /> New appointment
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
