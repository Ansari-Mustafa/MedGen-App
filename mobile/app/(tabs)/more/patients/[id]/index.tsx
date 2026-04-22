import { View, Text, SafeAreaView, ScrollView, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Pencil } from 'lucide-react-native';
import { getPatient, deletePatient } from '@/services/api/patients';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { colors } from '@/constants/theme';
import { formatDate } from '@/utils/formatting';
import { extractApiError } from '@/utils/errors';
import type { Patient } from '@/types/models';

export default function PatientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: patient, isLoading } = useQuery<Patient>({
    queryKey: ['patient', id],
    queryFn: () => getPatient(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deletePatient(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patients'] });
      router.back();
    },
    onError: (err) => Alert.alert('Error', extractApiError(err)),
  });

  if (isLoading || !patient) return <LoadingSpinner fullScreen />;

  const infoRows = [
    { label: 'Date of Birth', value: formatDate(patient.dob) },
    { label: 'Email', value: patient.email ?? '-' },
    { label: 'Phone', value: patient.phone ?? '-' },
    { label: 'Address', value: patient.address ?? '-' },
    { label: 'NI Number', value: patient.nino ?? '-' },
  ];

  const confirmDelete = () => {
    Alert.alert(
      'Delete patient?',
      `This will permanently remove ${patient.full_name}.`,
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
          Patient Details
        </Text>
        <Pressable
          onPress={() => router.push(`/(tabs)/more/patients/${id}/edit` as never)}
          hitSlop={12}
        >
          <Pencil size={20} color={colors.primary[800]} strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
        <Card variant="elevated" padding={20}>
          <View style={{ alignItems: 'center', gap: 10 }}>
            <Avatar name={patient.full_name} size={64} />
            <Text style={{ fontSize: 22, fontWeight: '700', color: colors.gray[900] }}>
              {patient.full_name}
            </Text>
          </View>
        </Card>

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
          Personal Information
        </Text>
        <Card variant="elevated" padding={0}>
          {infoRows.map((row, idx) => (
            <View
              key={row.label}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 13,
                borderBottomWidth: idx < infoRows.length - 1 ? 1 : 0,
                borderBottomColor: colors.gray[100],
              }}
            >
              <Text style={{ fontSize: 14, color: colors.gray[500] }}>{row.label}</Text>
              <Text
                style={{ fontSize: 14, fontWeight: '500', color: colors.gray[900], maxWidth: '55%', textAlign: 'right' }}
                numberOfLines={2}
              >
                {row.value}
              </Text>
            </View>
          ))}
        </Card>

        {patient.notes && (
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
                {patient.notes}
              </Text>
            </Card>
          </>
        )}

        <View style={{ marginTop: 28 }}>
          <Button
            title={deleteMutation.isPending ? 'Deleting…' : 'Delete Patient'}
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
