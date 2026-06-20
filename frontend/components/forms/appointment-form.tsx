"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listPatients } from "@/lib/api/endpoints/patients";
import { qk } from "@/lib/api/query-keys";
import type {
  Appointment,
  AppointmentCreate,
  AppointmentStatus,
} from "@/types/models";

const schema = z.object({
  patient_id: z.string().min(1, "Required"),
  scheduled_at: z.string().optional(),
  type: z.string().optional(),
  notes: z.string().optional(),
  status: z
    .enum(["scheduled", "completed", "cancelled"] as const)
    .optional(),
});
type FormData = z.infer<typeof schema>;

export function AppointmentForm({
  initial,
  onSubmit,
  submitLabel = "Save",
  pending,
  showStatus,
}: {
  initial?: Appointment | null;
  onSubmit: (data: AppointmentCreate & { status?: AppointmentStatus }) => void | Promise<void>;
  submitLabel?: string;
  pending?: boolean;
  showStatus?: boolean;
}) {
  const { data: patients, isLoading: loadingPatients } = useQuery({
    queryKey: qk.patients.list(),
    queryFn: listPatients,
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      patient_id: initial?.patient_id ?? "",
      scheduled_at: initial?.scheduled_at
        ? toLocalInput(initial.scheduled_at)
        : "",
      type: initial?.type ?? "",
      notes: initial?.notes ?? "",
      status: (initial?.status as AppointmentStatus) ?? "scheduled",
    },
  });

  const submit = handleSubmit(async (data) => {
    const payload: AppointmentCreate & { status?: AppointmentStatus } = {
      patient_id: data.patient_id,
      ...(data.scheduled_at
        ? { scheduled_at: new Date(data.scheduled_at).toISOString() }
        : {}),
      ...(data.type ? { type: data.type } : {}),
      ...(data.notes ? { notes: data.notes } : {}),
      ...(showStatus && data.status ? { status: data.status } : {}),
    };
    await onSubmit(payload);
  });

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field label="Patient" error={errors.patient_id?.message}>
        <Controller
          name="patient_id"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={loadingPatients}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a patient" />
              </SelectTrigger>
              <SelectContent>
                {(patients ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Scheduled for">
          <Input type="datetime-local" {...register("scheduled_at")} />
        </Field>
        <Field label="Type">
          <Input
            placeholder="initial_assessment, follow_up…"
            {...register("type")}
          />
        </Field>
      </div>

      {showStatus && (
        <Field label="Status">
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(v) => field.onChange(v as AppointmentStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </Field>
      )}

      <Field label="Notes">
        <Textarea rows={4} {...register("notes")} />
      </Field>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isSubmitting || pending}>
          {(isSubmitting || pending) && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const tz = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 16);
}
