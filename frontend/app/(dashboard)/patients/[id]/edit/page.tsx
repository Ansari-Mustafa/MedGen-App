"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PatientForm } from "@/components/forms/patient-form";
import { getPatient, updatePatient } from "@/lib/api/endpoints/patients";
import { qk } from "@/lib/api/query-keys";
import { extractApiError } from "@/lib/utils/errors";

export default function EditPatientPage({
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

  const update = useMutation({
    mutationFn: (data: Parameters<typeof updatePatient>[1]) =>
      updatePatient(id, data),
    onSuccess: (p) => {
      qc.setQueryData(qk.patients.detail(id), p);
      qc.invalidateQueries({ queryKey: qk.patients.list() });
      toast.success("Patient updated");
      router.replace(`/patients/${id}`);
    },
    onError: (err) => toast.error(extractApiError(err, "Could not save changes")),
  });

  return (
    <div className="flex flex-col gap-5">
      <Link
        href={`/patients/${id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Edit patient</h1>
      </header>
      <Card>
        <CardContent className="p-5 md:p-6">
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <PatientForm
              initial={patient ?? null}
              onSubmit={(data) => update.mutate(data)}
              submitLabel="Save changes"
              pending={update.isPending}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
