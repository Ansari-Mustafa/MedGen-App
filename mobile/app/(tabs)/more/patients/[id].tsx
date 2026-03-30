import { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { patientService } from '@/services';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { colors } from '@/constants/theme';
import { formatDate } from '@/utils/formatting';
import type { Patient } from '@/types/models';

export default function PatientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      patientService.getPatient(Number(id)).then((data) => {
        setPatient(data);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading || !patient) return <LoadingSpinner fullScreen />;

  const infoRows = [
    { label: 'Date of Birth', value: formatDate(patient.date_of_birth) },
    { label: 'Gender', value: patient.gender ?? '-' },
    { label: 'Email', value: patient.email ?? '-' },
    { label: 'Phone', value: patient.phone ?? '-' },
    { label: 'Address', value: patient.address ?? '-' },
    { label: 'NHS Number', value: patient.nhs_number ?? '-' },
    { label: 'MRN', value: patient.medical_record_number ?? '-' },
    { label: 'Emergency Contact', value: patient.emergency_contact_name ?? '-' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.gray[50] }}>
      {/* Header */}
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
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
        {/* Profile card */}
        <Card variant="elevated" padding={20}>
          <View style={{ alignItems: 'center', gap: 10 }}>
            <Avatar firstName={patient.first_name} lastName={patient.last_name} size={64} />
            <Text style={{ fontSize: 22, fontWeight: '700', color: colors.gray[900] }}>
              {patient.first_name} {patient.last_name}
            </Text>
            <Badge label={patient.is_active ? 'Active' : 'Inactive'} variant={patient.is_active ? 'success' : 'error'} />
          </View>
        </Card>

        {/* Info rows */}
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

        {/* Notes */}
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
      </ScrollView>
    </SafeAreaView>
  );
}
