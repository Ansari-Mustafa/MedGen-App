import { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, FlatList, Pressable } from 'react-native';
import { Calendar } from 'lucide-react-native';
import { appointmentService } from '@/services';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { SearchBar } from '@/components/ui/SearchBar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { colors } from '@/constants/theme';
import { formatDate, formatTime } from '@/utils/formatting';
import type { Appointment } from '@/types/models';

const FILTERS = ['Today', 'Upcoming', 'All'] as const;

function statusVariant(status: string) {
  switch (status) {
    case 'confirmed': return 'success' as const;
    case 'in_progress': return 'warning' as const;
    case 'completed': return 'info' as const;
    case 'cancelled': return 'error' as const;
    default: return 'default' as const;
  }
}

export default function AppointmentsScreen() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('Upcoming');

  useEffect(() => {
    appointmentService.getAppointments().then((data) => {
      setAppointments(data);
      setLoading(false);
    });
  }, []);

  const today = new Date().toISOString().split('T')[0];

  const filtered = appointments.filter((a) => {
    const matchesSearch = a.patient_name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === 'All' ||
      (filter === 'Today' && a.appointment_date === today) ||
      (filter === 'Upcoming' && a.appointment_date >= today);
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
          Appointments
        </Text>
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
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 10 }}
        renderItem={({ item }) => (
          <Card variant="elevated" padding={14}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Avatar
                firstName={item.patient_name.split(' ')[0]}
                lastName={item.patient_name.split(' ')[1] ?? ''}
                size={44}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.gray[900] }}>
                  {item.patient_name}
                </Text>
                <Text style={{ fontSize: 13, color: colors.gray[500], marginTop: 2 }}>
                  {formatDate(item.appointment_date)} · {formatTime(item.start_time)}
                </Text>
                {item.reason && (
                  <Text
                    style={{ fontSize: 12, color: colors.gray[500], marginTop: 2 }}
                    numberOfLines={1}
                  >
                    {item.reason}
                  </Text>
                )}
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Badge label={item.status} variant={statusVariant(item.status)} />
                {item.priority === 'urgent' && (
                  <Badge label="Urgent" variant="error" />
                )}
              </View>
            </View>
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
          </View>
        }
      />
    </SafeAreaView>
  );
}
