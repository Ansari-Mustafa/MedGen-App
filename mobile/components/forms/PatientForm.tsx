import { View } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { DateTimePickerField } from '@/components/ui/DateTimePickerField';
import { parseISODate, toISODateString } from '@/utils/formatting';
import type { Patient, PatientCreate } from '@/types/models';

const schema = z.object({
  full_name: z.string().min(1, 'Name is required'),
  dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date')
    .optional()
    .or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  nino: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface PatientFormProps {
  initialValues?: Partial<Patient>;
  submitLabel: string;
  submitting?: boolean;
  onSubmit: (values: PatientCreate) => void | Promise<void>;
}

export function PatientForm({ initialValues, submitLabel, submitting, onSubmit }: PatientFormProps) {
  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: initialValues?.full_name ?? '',
      dob: initialValues?.dob ?? '',
      email: initialValues?.email ?? '',
      phone: initialValues?.phone ?? '',
      nino: initialValues?.nino ?? '',
      address: initialValues?.address ?? '',
      notes: initialValues?.notes ?? '',
    },
  });

  const onValid = (values: FormValues) => {
    const payload: PatientCreate = { full_name: values.full_name };
    if (values.dob) payload.dob = values.dob;
    if (values.email) payload.email = values.email;
    if (values.phone) payload.phone = values.phone;
    if (values.nino) payload.nino = values.nino;
    if (values.address) payload.address = values.address;
    if (values.notes) payload.notes = values.notes;
    return onSubmit(payload);
  };

  return (
    <View style={{ gap: 16 }}>
      <Controller
        control={control}
        name="full_name"
        render={({ field }) => (
          <Input
            label="Full Name"
            placeholder="Jane Smith"
            value={field.value}
            onChangeText={field.onChange}
            error={errors.full_name?.message}
            autoCapitalize="words"
          />
        )}
      />
      <Controller
        control={control}
        name="dob"
        render={({ field }) => (
          <DateTimePickerField
            label="Date of Birth"
            mode="date"
            value={parseISODate(field.value)}
            onChange={(d) => field.onChange(toISODateString(d))}
            error={errors.dob?.message}
            maximumDate={new Date()}
          />
        )}
      />
      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <Input
            label="Email"
            placeholder="patient@example.com"
            value={field.value ?? ''}
            onChangeText={field.onChange}
            error={errors.email?.message}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        )}
      />
      <Controller
        control={control}
        name="phone"
        render={({ field }) => (
          <Input
            label="Phone"
            placeholder="+44 20 ..."
            value={field.value ?? ''}
            onChangeText={field.onChange}
            error={errors.phone?.message}
            keyboardType="phone-pad"
          />
        )}
      />
      <Controller
        control={control}
        name="nino"
        render={({ field }) => (
          <Input
            label="NI Number"
            placeholder="QQ 12 34 56 C"
            value={field.value ?? ''}
            onChangeText={field.onChange}
            error={errors.nino?.message}
            autoCapitalize="characters"
          />
        )}
      />
      <Controller
        control={control}
        name="address"
        render={({ field }) => (
          <Input
            label="Address"
            placeholder="Street, city, postcode"
            value={field.value ?? ''}
            onChangeText={field.onChange}
            error={errors.address?.message}
            multiline
          />
        )}
      />
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
    </View>
  );
}
