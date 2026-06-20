"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { PatientForm } from "@/components/forms/patient-form";
import { createPatient } from "@/lib/api/endpoints/patients";
import { qk } from "@/lib/api/query-keys";
import { extractApiError } from "@/lib/utils/errors";

export default function NewPatientPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const create = useMutation({
    mutationFn: createPatient,
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: qk.patients.list() });
      toast.success("Patient created");
      router.replace(`/patients/${p.id}`);
    },
    onError: (err) => toast.error(extractApiError(err, "Could not create patient")),
  });

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/patients"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to patients
      </Link>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">New patient</h1>
        <p className="text-sm text-muted-foreground">
          Create a record so you can schedule appointments.
        </p>
      </header>
      <Card>
        <CardContent className="p-5 md:p-6">
          <PatientForm
            onSubmit={(data) => create.mutate(data)}
            submitLabel="Create patient"
            pending={create.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
