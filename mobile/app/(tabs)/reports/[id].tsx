import { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { reportService } from '@/services';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { colors } from '@/constants/theme';
import { formatDate } from '@/utils/formatting';
import type { MedicalReport } from '@/types/models';

export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [report, setReport] = useState<MedicalReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      reportService.getReport(Number(id)).then((data) => {
        setReport(data);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading || !report) return <LoadingSpinner fullScreen />;

  const statusVariant =
    report.status === 'approved'
      ? ('success' as const)
      : report.status === 'generating'
        ? ('warning' as const)
        : ('default' as const);

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
        <Badge label={report.status} variant={statusVariant} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
        {/* Patient info card */}
        <Card variant="elevated" padding={14}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Avatar
              firstName={report.patient_name.split(' ')[0]}
              lastName={report.patient_name.split(' ')[1] ?? ''}
              size={48}
            />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.gray[900] }}>
                {report.patient_name}
              </Text>
              <Text style={{ fontSize: 13, color: colors.gray[500], marginTop: 2 }}>
                {formatDate(report.report_date)} · Version {report.version}
              </Text>
            </View>
          </View>
        </Card>

        {/* Report title */}
        <Text
          style={{
            fontSize: 20,
            fontWeight: '700',
            color: colors.gray[900],
            marginTop: 20,
            marginBottom: 12,
          }}
        >
          {report.title}
        </Text>

        {/* Report content */}
        <Card variant="outlined" padding={16}>
          <Text style={{ fontSize: 15, color: colors.gray[700], lineHeight: 22 }}>
            {report.content.replace(/<[^>]*>/g, '\n').replace(/\n{2,}/g, '\n\n').trim() ||
              'Report is being generated...'}
          </Text>
        </Card>

        {/* Actions */}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
          <View style={{ flex: 1 }}>
            <Button title="Export PDF" onPress={() => {}} variant="primary" fullWidth />
          </View>
          <View style={{ flex: 1 }}>
            <Button title="Edit" onPress={() => {}} variant="outline" fullWidth />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
