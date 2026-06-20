"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { AppointmentForm } from "@/components/forms/appointment-form";
import { createAppointment } from "@/lib/api/endpoints/appointments";
import { qk } from "@/lib/api/query-keys";
import { extractApiError } from "@/lib/utils/errors";

export default function NewAppointmentPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const create = useMutation({
    mutationFn: createAppointment,
    onSuccess: (a) => {
      qc.invalidateQueries({ queryKey: qk.appointments.list() });
      qc.invalidateQueries({ queryKey: qk.dashboard });
      toast.success("Appointment created");
      router.replace(`/appointments/${a.id}`);
    },
    onError: (err) =>
      toast.error(extractApiError(err, "Could not create appointment")),
  });

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/appointments"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">New appointment</h1>
        <p className="text-sm text-muted-foreground">
          Schedule a consultation. You can record it later.
        </p>
      </header>
      <Card>
        <CardContent className="p-5 md:p-6">
          <AppointmentForm
            onSubmit={(data) => create.mutate(data)}
            submitLabel="Create"
            pending={create.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
