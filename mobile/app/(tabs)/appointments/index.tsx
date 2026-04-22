import { useState } from 'react';
import { View, Text, SafeAreaView, FlatList, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Plus } from 'lucide-react-native';
import { getAppointments } from '@/services/api/appointments';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { SearchBar } from '@/components/ui/SearchBar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { colors } from '@/constants/theme';
import { formatDateTime } from '@/utils/formatting';
import type { Appointment, AppointmentStatus } from '@/types/models';

const FILTERS = ['Today', 'Upcoming', 'All'] as const;

function statusVariant(status: AppointmentStatus) {
  switch (status) {
    case 'completed': return 'info' as const;
    case 'cancelled': return 'error' as const;
    case 'scheduled':
    default: return 'success' as const;
  }
}

function isSameDay(iso: string | null, dayISO: string): boolean {
  if (!iso) return false;
  return iso.slice(0, 10) === dayISO;
}

export default function AppointmentsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('Upcoming');

  const { data: appointments = [], isLoading, refetch, isRefetching } = useQuery<Appointment[]>({
    queryKey: ['appointments'],
    queryFn: getAppointments,
  });

  const today = new Date().toISOString().slice(0, 10);
  const nowISO = new Date().toISOString();

  const filtered = appointments.filter((a) => {
    const name = (a.patient_name ?? '').toLowerCase();
    const matchesSearch = name.includes(search.toLowerCase());
    const matchesFilter =
      filter === 'All' ||
      (filter === 'Today' && isSameDay(a.scheduled_at, today)) ||
      (filter === 'Upcoming' && (a.scheduled_at ?? '') >= nowISO);
    return matchesSearch && matchesFilter;
  });

  if (isLoading) return <LoadingSpinner fullScreen />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.gray[50] }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 26,
              fontWeight: '800',
              color: colors.gray[900],
              letterSpacing: -0.5,
              flex: 1,
            }}
          >
            Appointments
          </Text>
          <Pressable
            onPress={() => router.push('/(tabs)/appointments/new' as never)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: colors.primary[800],
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
          </Pressable>
        </View>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search patients..." />

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
              onPress={() => router.push(`/(tabs)/appointments/${item.id}` as never)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
            >
              <Avatar name={item.patient_name} size={44} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.gray[900] }}>
                  {item.patient_name ?? 'Unknown patient'}
                </Text>
                <Text style={{ fontSize: 13, color: colors.gray[500], marginTop: 2 }}>
                  {formatDateTime(item.scheduled_at)}
                </Text>
                {item.type && (
                  <Text
                    style={{ fontSize: 12, color: colors.gray[500], marginTop: 2 }}
                    numberOfLines={1}
                  >
                    {item.type}
                  </Text>
                )}
              </View>
              <Badge label={item.status} variant={statusVariant(item.status)} />
            </Pressable>
          </Card>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 60, gap: 12 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.gray[100], alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={28} color={colors.gray[500]} strokeWidth={1.5} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.gray[700] }}>
              No appointments
            </Text>
            <Text style={{ fontSize: 14, color: colors.gray[500] }}>
              Tap + to schedule one
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
