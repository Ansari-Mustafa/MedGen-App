import { useState } from 'react';
import { View, Text, SafeAreaView, FlatList, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { FileText } from 'lucide-react-native';
import { getReports } from '@/services/api/reports';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { SearchBar } from '@/components/ui/SearchBar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { colors } from '@/constants/theme';
import { formatDate } from '@/utils/formatting';
import type { MedicalReport, ReportStatus } from '@/types/models';

const FILTERS = ['All', 'Pending', 'Ready', 'Approved'] as const;

function statusToBadgeVariant(status: ReportStatus) {
  switch (status) {
    case 'approved': return 'success' as const;
    case 'ready': return 'info' as const;
    case 'generating':
    case 'pending': return 'warning' as const;
    case 'error': return 'error' as const;
    default: return 'default' as const;
  }
}

function reportTitle(r: MedicalReport): string {
  const name = r.patient_name ?? 'Report';
  return `${name} — ${formatDate(r.created_at)}`;
}

export default function ReportsListScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');

  const { data: reports = [], isLoading, refetch, isRefetching } = useQuery<MedicalReport[]>({
    queryKey: ['reports'],
    queryFn: getReports,
  });

  const filtered = reports.filter((r) => {
    const name = (r.patient_name ?? '').toLowerCase();
    const matchesSearch = name.includes(search.toLowerCase());
    const matchesFilter = filter === 'All' || r.status.toLowerCase() === filter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  if (isLoading) return <LoadingSpinner fullScreen />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.gray[50] }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
        <Text
          style={{
            fontSize: 26,
            fontWeight: '800',
            color: colors.gray[900],
            letterSpacing: -0.5,
            marginBottom: 16,
          }}
        >
          Reports
        </Text>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search reports..." />

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          {FILTERS.map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 100,
                backgroundColor: filter === f ? colors.primary[800] : colors.gray[100],
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: filter === f ? '#FFFFFF' : colors.gray[700],
                }}
              >
                {f}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 10 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        renderItem={({ item }) => (
          <Card variant="elevated" padding={14}>
            <Pressable
              onPress={() => router.push(`/(tabs)/reports/${item.id}` as never)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
            >
              <Avatar name={item.patient_name} size={44} />
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 15, fontWeight: '600', color: colors.gray[900] }}
                  numberOfLines={1}
                >
                  {reportTitle(item)}
                </Text>
                <Text style={{ fontSize: 13, color: colors.gray[500], marginTop: 2 }}>
                  {item.patient_name ?? 'Unknown patient'}
                </Text>
              </View>
              <Badge label={item.status} variant={statusToBadgeVariant(item.status)} />
            </Pressable>
          </Card>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 60, gap: 12 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.gray[100], alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={28} color={colors.gray[500]} strokeWidth={1.5} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.gray[700] }}>
              No reports yet
            </Text>
            <Text style={{ fontSize: 14, color: colors.gray[500] }}>
              Record a session to generate your first report
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
