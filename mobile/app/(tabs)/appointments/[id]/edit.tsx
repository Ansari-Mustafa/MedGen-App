import { View, Text, SafeAreaView, ScrollView, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react-native';
import { AppointmentForm, type AppointmentFormPayload } from '@/components/forms/AppointmentForm';
import { getAppointment, updateAppointment } from '@/services/api/appointments';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { colors } from '@/constants/theme';
import { extractApiError } from '@/utils/errors';
import type { Appointment, AppointmentUpdate } from '@/types/models';

export default function EditAppointmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: appt, isLoading } = useQuery<Appointment>({
    queryKey: ['appointment', id],
    queryFn: () => getAppointment(id!),
    enabled: !!id,
  });

  const mutation = useMutation({
    mutationFn: (data: AppointmentUpdate) => updateAppointment(id!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['appointment', id] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      router.back();
    },
    onError: (err) => Alert.alert('Could not save appointment', extractApiError(err)),
  });

  if (isLoading || !appt) return <LoadingSpinner fullScreen />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.gray[50] }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 12,
          gap: 12,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ArrowLeft size={24} color={colors.gray[900]} strokeWidth={2} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: colors.gray[900] }}>
          Edit Appointment
        </Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          <AppointmentForm
            mode="edit"
            initialValues={appt}
            submitLabel={mutation.isPending ? 'Saving…' : 'Save Changes'}
            submitting={mutation.isPending}
            onSubmit={(values: AppointmentFormPayload) => {
              const { patient_id: _patient_id, ...patch } = values;
              mutation.mutate(patch as AppointmentUpdate);
            }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
