import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronDown } from 'lucide-react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PickerModal } from '@/components/ui/PickerModal';
import { getPatients } from '@/services/api/patients';
import { colors } from '@/constants/theme';
import type { Appointment, AppointmentCreate, AppointmentStatus, Patient } from '@/types/models';

const TYPE_OPTIONS = [
  { id: 'consultation', label: 'Consultation' },
  { id: 'follow_up', label: 'Follow-up' },
  { id: 'review', label: 'Review' },
  { id: 'procedure', label: 'Procedure' },
];

const STATUS_OPTIONS: { id: AppointmentStatus; label: string }[] = [
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

const createSchema = z.object({
  patient_id: z.string().uuid('Select a patient'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD').optional().or(z.literal('')),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM').optional().or(z.literal('')),
  type: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['scheduled', 'completed', 'cancelled']).optional(),
});

type FormValues = z.infer<typeof createSchema>;

export interface AppointmentFormPayload {
  patient_id: string;
  scheduled_at?: string;
  type?: string;
  notes?: string;
  status?: AppointmentStatus;
}

interface AppointmentFormProps {
  mode: 'create' | 'edit';
  initialValues?: Partial<Appointment>;
  submitLabel: string;
  submitting?: boolean;
  onSubmit: (values: AppointmentFormPayload) => void | Promise<void>;
}

function splitScheduledAt(iso: string | null | undefined): { date: string; time: string } {
  if (!iso) return { date: '', time: '' };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: '', time: '' };
  const date = d.toISOString().slice(0, 10);
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return { date, time };
}

function combineDateTime(date: string, time: string): string | undefined {
  if (!date) return undefined;
  const t = time || '09:00';
  // Interpret as local time; convert to ISO for backend.
  const local = new Date(`${date}T${t}:00`);
  if (Number.isNaN(local.getTime())) return undefined;
  return local.toISOString();
}

export function AppointmentForm({ mode, initialValues, submitLabel, submitting, onSubmit }: AppointmentFormProps) {
  const { date: initDate, time: initTime } = splitScheduledAt(initialValues?.scheduled_at);

  const { control, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      patient_id: initialValues?.patient_id ?? '',
      date: initDate,
      time: initTime,
      type: initialValues?.type ?? '',
      notes: initialValues?.notes ?? '',
      status: (initialValues?.status as AppointmentStatus | undefined) ?? 'scheduled',
    },
  });

  const patientId = watch('patient_id');
  const typeValue = watch('type');
  const statusValue = watch('status');

  const [showPatientPicker, setShowPatientPicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  const { data: patients = [], isLoading: loadingPatients } = useQuery<Patient[]>({
    queryKey: ['patients'],
    queryFn: getPatients,
    enabled: mode === 'create' || !initialValues?.patient_id,
  });

  const selectedPatient = patients.find((p) => p.id === patientId);

  const onValid = (values: FormValues) => {
    const scheduled_at = combineDateTime(values.date ?? '', values.time ?? '');
    const payload: AppointmentFormPayload = {
      patient_id: values.patient_id,
      ...(scheduled_at ? { scheduled_at } : {}),
      ...(values.type ? { type: values.type } : {}),
      ...(values.notes ? { notes: values.notes } : {}),
      ...(values.status ? { status: values.status } : {}),
    };
    return onSubmit(payload);
  };

  return (
    <View style={{ gap: 16 }}>
      {/* Patient picker */}
      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 14, fontWeight: '500', color: colors.gray[700] }}>Patient</Text>
        <Pressable
          onPress={() => setShowPatientPicker(true)}
          disabled={mode === 'edit'}
          style={{ opacity: mode === 'edit' ? 0.6 : 1 }}
        >
          <Card variant="outlined" padding={14}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ flex: 1, fontSize: 15, color: selectedPatient ? colors.gray[900] : colors.gray[500] }}>
                {selectedPatient?.full_name
                  ?? (initialValues?.patient_id ? 'Existing patient' : 'Select patient…')}
              </Text>
              {mode === 'create' && <ChevronDown size={16} color={colors.gray[500]} strokeWidth={2} />}
            </View>
          </Card>
        </Pressable>
        {errors.patient_id && (
          <Text style={{ fontSize: 12, color: colors.error.DEFAULT }}>{errors.patient_id.message}</Text>
        )}
      </View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Controller
            control={control}
            name="date"
            render={({ field }) => (
              <Input
                label="Date"
                placeholder="YYYY-MM-DD"
                value={field.value ?? ''}
                onChangeText={field.onChange}
                error={errors.date?.message}
                autoCapitalize="none"
              />
            )}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Controller
            control={control}
            name="time"
            render={({ field }) => (
              <Input
                label="Time"
                placeholder="HH:MM"
                value={field.value ?? ''}
                onChangeText={field.onChange}
                error={errors.time?.message}
                autoCapitalize="none"
              />
            )}
          />
        </View>
      </View>

      {/* Type picker */}
      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 14, fontWeight: '500', color: colors.gray[700] }}>Type</Text>
        <Pressable onPress={() => setShowTypePicker(true)}>
          <Card variant="outlined" padding={14}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ flex: 1, fontSize: 15, color: typeValue ? colors.gray[900] : colors.gray[500] }}>
                {TYPE_OPTIONS.find((o) => o.id === typeValue)?.label ?? typeValue ?? 'Select type…'}
              </Text>
              <ChevronDown size={16} color={colors.gray[500]} strokeWidth={2} />
            </View>
          </Card>
        </Pressable>
      </View>

      {mode === 'edit' && (
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 14, fontWeight: '500', color: colors.gray[700] }}>Status</Text>
          <Pressable onPress={() => setShowStatusPicker(true)}>
            <Card variant="outlined" padding={14}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ flex: 1, fontSize: 15, color: colors.gray[900] }}>
                  {STATUS_OPTIONS.find((o) => o.id === statusValue)?.label ?? statusValue}
                </Text>
                <ChevronDown size={16} color={colors.gray[500]} strokeWidth={2} />
              </View>
            </Card>
          </Pressable>
        </View>
      )}

      <Controller
        control={control}
        name="notes"
        render={({ field }) => (
          <Input
            label="Notes"
            placeholder="Anything relevant"
            value={field.value ?? ''}
            onChangeText={field.onChange}
            error={errors.notes?.message}
            multiline
          />
        )}
      />

      <Button
        title={submitLabel}
        onPress={handleSubmit(onValid)}
        loading={submitting}
        fullWidth
        size="lg"
      />

      <PickerModal<Patient>
        visible={showPatientPicker}
        title="Select Patient"
        items={patients}
        loading={loadingPatients}
        labelKey="full_name"
        onSelect={(p) => setValue('patient_id', p.id, { shouldValidate: true })}
        onClose={() => setShowPatientPicker(false)}
      />

      <PickerModal
        visible={showTypePicker}
        title="Select Type"
        items={TYPE_OPTIONS}
        labelKey="label"
        onSelect={(t) => setValue('type', t.id, { shouldValidate: true })}
        onClose={() => setShowTypePicker(false)}
      />

      <PickerModal
        visible={showStatusPicker}
        title="Select Status"
        items={STATUS_OPTIONS}
        labelKey="label"
        onSelect={(s) => setValue('status', s.id, { shouldValidate: true })}
        onClose={() => setShowStatusPicker(false)}
      />
    </View>
  );
}
