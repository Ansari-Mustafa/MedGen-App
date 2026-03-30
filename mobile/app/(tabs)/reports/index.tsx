import { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { FileText } from 'lucide-react-native';
import { reportService } from '@/services';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { SearchBar } from '@/components/ui/SearchBar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { colors } from '@/constants/theme';
import { formatDate } from '@/utils/formatting';
import type { MedicalReport } from '@/types/models';

const FILTERS = ['All', 'Generated', 'Approved', 'Exported'] as const;

function statusToBadgeVariant(status: string) {
  switch (status) {
    case 'approved': return 'success' as const;
    case 'exported': return 'info' as const;
    case 'generating': return 'warning' as const;
    case 'generated': return 'default' as const;
    default: return 'default' as const;
  }
}

export default function ReportsListScreen() {
  const router = useRouter();
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('All');

  useEffect(() => {
    reportService.getReports().then((data) => {
      setReports(data);
      setLoading(false);
    });
  }, []);

  const filtered = reports.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.patient_name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === 'All' || r.status.toLowerCase() === filter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  if (loading) return <LoadingSpinner fullScreen />;

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

        {/* Filter chips */}
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
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 10 }}
        renderItem={({ item }) => (
          <Card variant="elevated" padding={14}>
            <Pressable
              onPress={() => router.push(`/(tabs)/reports/${item.id}` as never)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
            >
              <Avatar
                firstName={item.patient_name.split(' ')[0]}
                lastName={item.patient_name.split(' ')[1] ?? ''}
                size={44}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 15, fontWeight: '600', color: colors.gray[900] }}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text style={{ fontSize: 13, color: colors.gray[500], marginTop: 2 }}>
                  {item.patient_name} · {formatDate(item.report_date)}
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
              No reports found
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
