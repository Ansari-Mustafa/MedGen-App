import { View, Text, SafeAreaView, ScrollView, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Mic, Pencil } from 'lucide-react-native';
import { getAppointment, deleteAppointment } from '@/services/api/appointments';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { colors } from '@/constants/theme';
import { formatDateTime } from '@/utils/formatting';
import { extractApiError } from '@/utils/errors';
import type { Appointment } from '@/types/models';

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: appt, isLoading } = useQuery<Appointment>({
    queryKey: ['appointment', id],
    queryFn: () => getAppointment(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteAppointment(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      router.back();
    },
    onError: (err) => Alert.alert('Error', extractApiError(err)),
  });

  if (isLoading || !appt) return <LoadingSpinner fullScreen />;

  const rows = [
    { label: 'When', value: formatDateTime(appt.scheduled_at) },
    { label: 'Type', value: appt.type ?? '-' },
    { label: 'Status', value: appt.status },
  ];

  const confirmDelete = () => {
    Alert.alert(
      'Delete appointment?',
      'This will permanently remove the appointment.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() },
      ],
    );
  };

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
          Appointment
        </Text>
        <Pressable
          onPress={() => router.push(`/(tabs)/appointments/${id}/edit` as never)}
          hitSlop={12}
        >
          <Pencil size={20} color={colors.primary[800]} strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
        <Card variant="elevated" padding={20}>
          <View style={{ alignItems: 'center', gap: 10 }}>
            <Avatar name={appt.patient_name} size={64} />
            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.gray[900] }}>
              {appt.patient_name ?? 'Unknown patient'}
            </Text>
            <Badge
              label={appt.status}
              variant={appt.status === 'completed' ? 'info' : appt.status === 'cancelled' ? 'error' : 'success'}
            />
          </View>
        </Card>

        <Card variant="elevated" padding={0} style={{ marginTop: 20 }}>
          {rows.map((row, idx) => (
            <View
              key={row.label}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 13,
                borderBottomWidth: idx < rows.length - 1 ? 1 : 0,
                borderBottomColor: colors.gray[100],
              }}
            >
              <Text style={{ fontSize: 14, color: colors.gray[500] }}>{row.label}</Text>
              <Text style={{ fontSize: 14, fontWeight: '500', color: colors.gray[900], maxWidth: '55%', textAlign: 'right' }} numberOfLines={2}>
                {row.value}
              </Text>
            </View>
          ))}
        </Card>

        {appt.notes && (
          <>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: colors.gray[500],
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                marginTop: 20,
                marginBottom: 8,
              }}
            >
              Notes
            </Text>
            <Card variant="outlined" padding={14}>
              <Text style={{ fontSize: 14, color: colors.gray[700], lineHeight: 20 }}>
                {appt.notes}
              </Text>
            </Card>
          </>
        )}

        <View style={{ marginTop: 24, gap: 12 }}>
          <Button
            title="Start Recording"
            onPress={() =>
              router.push({
                pathname: '/(tabs)/record',
                params: { appointmentId: appt.id },
              })
            }
            variant="primary"
            fullWidth
            size="lg"
            icon={<Mic size={18} color="#FFFFFF" strokeWidth={2} />}
          />
          <Button
            title={deleteMutation.isPending ? 'Deleting…' : 'Delete Appointment'}
            onPress={confirmDelete}
            variant="outline"
            fullWidth
            loading={deleteMutation.isPending}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
