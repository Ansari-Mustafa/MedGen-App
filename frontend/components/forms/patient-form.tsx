"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Patient, PatientCreate } from "@/types/models";

const schema = z.object({
  full_name: z.string().min(1, "Required"),
  dob: z.string().optional().or(z.literal("")),
  nino: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email().or(z.literal("")).optional(),
  address: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

export function PatientForm({
  initial,
  onSubmit,
  submitLabel = "Save",
  pending,
}: {
  initial?: Patient | null;
  onSubmit: (data: PatientCreate) => void | Promise<void>;
  submitLabel?: string;
  pending?: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: initial?.full_name ?? "",
      dob: initial?.dob ?? "",
      nino: initial?.nino ?? "",
      phone: initial?.phone ?? "",
      email: initial?.email ?? "",
      address: initial?.address ?? "",
      notes: initial?.notes ?? "",
    },
  });

  const submit = handleSubmit(async (data) => {
    const payload: PatientCreate = {
      full_name: data.full_name,
      ...(data.dob ? { dob: data.dob } : {}),
      ...(data.nino ? { nino: data.nino } : {}),
      ...(data.phone ? { phone: data.phone } : {}),
      ...(data.email ? { email: data.email } : {}),
      ...(data.address ? { address: data.address } : {}),
      ...(data.notes ? { notes: data.notes } : {}),
    };
    await onSubmit(payload);
  });

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field label="Full name" error={errors.full_name?.message}>
        <Input {...register("full_name")} placeholder="John Doe" />
      </Field>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Date of birth" error={errors.dob?.message}>
          <Input type="date" {...register("dob")} />
        </Field>
        <Field label="NINO" error={errors.nino?.message}>
          <Input {...register("nino")} placeholder="QQ 12 34 56 C" />
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Phone" error={errors.phone?.message}>
          <Input type="tel" {...register("phone")} />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <Input type="email" {...register("email")} />
        </Field>
      </div>
      <Field label="Address" error={errors.address?.message}>
        <Input {...register("address")} />
      </Field>
      <Field label="Notes" error={errors.notes?.message}>
        <Textarea rows={3} {...register("notes")} />
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
