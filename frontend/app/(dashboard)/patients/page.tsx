"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { listPatients } from "@/lib/api/endpoints/patients";
import { qk } from "@/lib/api/query-keys";
import {
  formatDate,
  getAvatarColor,
  getInitials,
} from "@/lib/utils/format";

export default function PatientsPage() {
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: qk.patients.list(),
    queryFn: listPatients,
  });

  const filtered = useMemo(() => {
    const items = data ?? [];
    if (!q) return items;
    const term = q.toLowerCase();
    return items.filter(
      (p) =>
        p.full_name.toLowerCase().includes(term) ||
        p.nino?.toLowerCase().includes(term) ||
        p.email?.toLowerCase().includes(term)
    );
  }, [data, q]);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Patients</h1>
          <p className="text-sm text-muted-foreground">
            All patients in your practice.
          </p>
        </div>
        <Button asChild>
          <Link href="/patients/new">
            <UserPlus className="h-4 w-4" /> New patient
          </Link>
        </Button>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, NINO, or email"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <ListSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-3">
          {filtered.map((p) => (
            <Link key={p.id} href={`/patients/${p.id}`} className="block">
              <Card className="transition-all hover:border-border-strong hover:shadow-sm">
                <CardContent className="flex items-center gap-4 p-4">
                  <Avatar className="h-11 w-11">
                    <AvatarFallback
                      style={{ backgroundColor: getAvatarColor(p.full_name) }}
                    >
                      {getInitials(p.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-semibold">
                      {p.full_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {p.dob ? `DOB ${formatDate(p.dob)}` : null}
                      {p.dob && p.nino ? " · " : null}
                      {p.nino ? `NINO ${p.nino}` : null}
                      {!p.dob && !p.nino ? "—" : null}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-muted-foreground">
          <Users className="h-5 w-5" />
        </span>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">No patients yet</p>
          <p className="text-xs text-muted-foreground">
            Add a patient to start scheduling appointments.
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href="/patients/new">
            <Plus className="h-4 w-4" /> Add patient
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
