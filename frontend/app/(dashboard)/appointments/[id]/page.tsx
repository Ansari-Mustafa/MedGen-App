"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, CalendarDays, Mic, Pencil, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AppointmentForm } from "@/components/forms/appointment-form";
import {
  deleteAppointment,
  getAppointment,
  updateAppointment,
} from "@/lib/api/endpoints/appointments";
import { qk } from "@/lib/api/query-keys";
import { extractApiError } from "@/lib/utils/errors";
import {
  formatAppointmentTime,
  getAvatarColor,
  getInitials,
} from "@/lib/utils/format";

export default function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: qk.appointments.detail(id),
    queryFn: () => getAppointment(id),
  });

  const update = useMutation({
    mutationFn: (payload: Parameters<typeof updateAppointment>[1]) =>
      updateAppointment(id, payload),
    onSuccess: (a) => {
      qc.setQueryData(qk.appointments.detail(id), a);
      qc.invalidateQueries({ queryKey: qk.appointments.list() });
      toast.success("Appointment updated");
    },
    onError: (err) =>
      toast.error(extractApiError(err, "Could not save changes")),
  });

  const remove = useMutation({
    mutationFn: () => deleteAppointment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.appointments.list() });
      toast.success("Appointment deleted");
      router.replace("/appointments");
    },
    onError: (err) =>
      toast.error(extractApiError(err, "Could not delete appointment")),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <p className="text-sm text-muted-foreground">Appointment not found.</p>
        <Button variant="outline" onClick={() => router.back()}>
          Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/appointments"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback
              style={{ backgroundColor: getAvatarColor(data.patient_name) }}
            >
              {getInitials(data.patient_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              {data.patient_name ?? "Unknown patient"}
            </h1>
            <p className="text-sm text-muted-foreground">
              <CalendarDays className="mr-1 inline h-3.5 w-3.5" />
              {formatAppointmentTime(data.scheduled_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href={`/record?appointmentId=${id}`}>
              <Mic className="h-4 w-4" /> Record
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-error hover:text-error">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete appointment?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove the appointment record.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => remove.mutate()}
                  className="bg-error text-white hover:bg-error/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      <Card>
        <CardContent className="p-5 md:p-6">
          <AppointmentForm
            initial={data}
            onSubmit={(payload) => update.mutate(payload)}
            submitLabel="Save changes"
            pending={update.isPending}
            showStatus
          />
        </CardContent>
      </Card>
    </div>
  );
}
