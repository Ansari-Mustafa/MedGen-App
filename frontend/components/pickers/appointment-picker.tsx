"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Check, ChevronDown, Search } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { listAppointments } from "@/lib/api/endpoints/appointments";
import { qk } from "@/lib/api/query-keys";
import { formatAppointmentTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { Appointment } from "@/types/models";

export function AppointmentPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (id: string, appointment: Appointment) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: qk.appointments.list(),
    queryFn: listAppointments,
  });

  const filtered = useMemo(() => {
    const items = data ?? [];
    if (!q) return items;
    const term = q.toLowerCase();
    return items.filter(
      (a) =>
        a.patient_name?.toLowerCase().includes(term) ||
        a.type?.toLowerCase().includes(term)
    );
  }, [data, q]);

  const selected = (data ?? []).find((a) => a.id === value);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-3 rounded-lg border border-border bg-card px-3.5 py-3 text-left transition-colors hover:bg-surface-2"
          )}
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
            <CalendarDays className="h-4 w-4" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-xs font-medium text-muted-foreground">
              Appointment
            </span>
            <span className="truncate text-sm font-medium">
              {selected
                ? selected.patient_name ?? "Unnamed patient"
                : "Select an appointment"}
            </span>
            {selected?.scheduled_at && (
              <span className="truncate text-xs text-muted-foreground">
                {formatAppointmentTime(selected.scheduled_at)}
              </span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Select appointment</SheetTitle>
          <SheetDescription>
            Pick the consultation this recording belongs to.
          </SheetDescription>
        </SheetHeader>
        <div className="border-b border-border p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search patients"
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <p className="p-4 text-sm text-muted-foreground">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No appointments found.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {filtered.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(a.id, a);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-surface-2",
                      value === a.id && "bg-primary-soft"
                    )}
                  >
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium">
                        {a.patient_name ?? "Unnamed patient"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatAppointmentTime(a.scheduled_at)}
                        {a.type ? ` · ${a.type}` : ""}
                      </span>
                    </div>
                    {value === a.id && <Check className="h-4 w-4 text-primary" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
