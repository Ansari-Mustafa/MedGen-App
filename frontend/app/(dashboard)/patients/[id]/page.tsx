"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
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
import { deletePatient, getPatient } from "@/lib/api/endpoints/patients";
import { qk } from "@/lib/api/query-keys";
import { extractApiError } from "@/lib/utils/errors";
import {
  formatDate,
  getAvatarColor,
  getInitials,
} from "@/lib/utils/format";

export default function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();

  const { data: patient, isLoading } = useQuery({
    queryKey: qk.patients.detail(id),
    queryFn: () => getPatient(id),
  });

  const remove = useMutation({
    mutationFn: () => deletePatient(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.patients.list() });
      toast.success("Patient deleted");
      router.replace("/patients");
    },
    onError: (err) => toast.error(extractApiError(err, "Could not delete patient")),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <p className="text-sm text-muted-foreground">Patient not found.</p>
        <Button variant="outline" onClick={() => router.back()}>
          Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/patients"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to patients
      </Link>

      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-14 w-14">
            <AvatarFallback
              style={{ backgroundColor: getAvatarColor(patient.full_name) }}
            >
              {getInitials(patient.full_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {patient.full_name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {patient.dob ? `Born ${formatDate(patient.dob)}` : "—"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href={`/patients/${id}/edit`}>
              <Pencil className="h-4 w-4" />
              Edit
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-error hover:text-error">
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this patient?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove the patient record. Existing appointments and
                  reports will not be deleted.
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
        <CardContent className="grid gap-4 p-5 md:grid-cols-2 md:p-6">
          <Detail label="NINO" value={patient.nino} />
          <Detail label="Phone" value={patient.phone} />
          <Detail label="Email" value={patient.email} />
          <Detail label="Address" value={patient.address} />
          <div className="md:col-span-2">
            <Detail label="Notes" value={patient.notes} multiline />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Detail({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string | null;
  multiline?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className={multiline ? "whitespace-pre-wrap text-sm" : "text-sm"}>
        {value || "—"}
      </span>
    </div>
  );
}
