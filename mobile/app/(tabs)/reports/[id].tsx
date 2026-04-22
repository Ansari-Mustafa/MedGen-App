import { View, Text, SafeAreaView, ScrollView, Pressable, Alert, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react-native';
import { getReport, getDownloadUrl } from '@/services/api/reports';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { colors } from '@/constants/theme';
import { formatDate } from '@/utils/formatting';
import { extractApiError } from '@/utils/errors';
import type { MedicalReport, ReportStatus } from '@/types/models';

function statusVariant(status: ReportStatus) {
  switch (status) {
    case 'approved': return 'success' as const;
    case 'ready': return 'info' as const;
    case 'generating':
    case 'pending': return 'warning' as const;
    case 'error': return 'error' as const;
    default: return 'default' as const;
  }
}

function renderFilled(json: Record<string, unknown>): string {
  const entries = Object.entries(json ?? {});
  if (entries.length === 0) return 'Report is still being generated…';
  return entries
    .map(([k, v]) => `${k}:\n${Array.isArray(v) ? v.join(', ') : String(v ?? '')}`)
    .join('\n\n');
}

export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: report, isLoading } = useQuery<MedicalReport>({
    queryKey: ['report', id],
    queryFn: () => getReport(id!),
    enabled: !!id,
  });

  if (isLoading || !report) return <LoadingSpinner fullScreen />;

  const handleExportPdf = async () => {
    try {
      const { url } = await getDownloadUrl(report.id, 'pdf');
      await Linking.openURL(url);
    } catch (err) {
      Alert.alert('Export failed', extractApiError(err));
    }
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
        <Text
          style={{
            flex: 1,
            fontSize: 18,
            fontWeight: '700',
            color: colors.gray[900],
          }}
          numberOfLines={1}
        >
          Report
        </Text>
        <Badge label={report.status} variant={statusVariant(report.status)} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
        <Card variant="elevated" padding={14}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Avatar name={report.patient_name} size={48} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.gray[900] }}>
                {report.patient_name ?? 'Unknown patient'}
              </Text>
              <Text style={{ fontSize: 13, color: colors.gray[500], marginTop: 2 }}>
                {formatDate(report.created_at)}
              </Text>
            </View>
          </View>
        </Card>

        <Text
          style={{
            fontSize: 20,
            fontWeight: '700',
            color: colors.gray[900],
            marginTop: 20,
            marginBottom: 12,
          }}
        >
          Report Content
        </Text>

        <Card variant="outlined" padding={16}>
          <Text style={{ fontSize: 15, color: colors.gray[700], lineHeight: 22 }}>
            {renderFilled(report.filled_json)}
          </Text>
        </Card>

        <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
          <View style={{ flex: 1 }}>
            <Button title="Export PDF" onPress={handleExportPdf} variant="primary" fullWidth />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
