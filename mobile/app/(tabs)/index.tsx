import { View, Text, ScrollView, SafeAreaView, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Mic, Users, FileText, Calendar } from 'lucide-react-native';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { colors } from '@/constants/theme';
import { getGreeting, formatDateTime, timeAgo } from '@/utils/formatting';
import type { DashboardStats } from '@/types/models';

const quickActions = [
  { label: 'Record', Icon: Mic, route: '/(tabs)/record', color: colors.primary[800] },
  { label: 'Patients', Icon: Users, route: '/(tabs)/more/patients', color: colors.info.DEFAULT },
  { label: 'Reports', Icon: FileText, route: '/(tabs)/reports', color: colors.success.DEFAULT },
  { label: 'Schedule', Icon: Calendar, route: '/(tabs)/appointments', color: colors.warning.DEFAULT },
];

function lastNameOf(fullName: string | null | undefined): string {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  return parts[parts.length - 1] ?? '';
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const { data: stats, isLoading, refetch, isRefetching } = useQuery<DashboardStats>({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then((r) => r.data),
  });

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading dashboard..." />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.gray[50] }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary[800]}
          />
        }
      >
        <View style={{ paddingTop: 16, paddingBottom: 20 }}>
          <Text style={{ fontSize: 14, color: colors.gray[500], fontWeight: '500' }}>
            {getGreeting()}
          </Text>
          <Text
            style={{
              fontSize: 26,
              fontWeight: '800',
              color: colors.gray[900],
              letterSpacing: -0.5,
            }}
          >
            {user?.full_name ? `Dr ${lastNameOf(user.full_name)}` : 'Welcome'}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
          <StatCard
            label="Patients"
            value={stats?.total_patients ?? 0}
            icon={<Users size={18} color={colors.primary[800]} strokeWidth={2} />}
            color={colors.primary[800]}
          />
          <StatCard
            label="This Month"
            value={stats?.reports_this_month ?? 0}
            icon={<FileText size={18} color={colors.success.DEFAULT} strokeWidth={2} />}
            color={colors.success.DEFAULT}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          <StatCard
            label="Total Reports"
            value={stats?.total_reports ?? 0}
            icon={<Mic size={18} color={colors.info.DEFAULT} strokeWidth={2} />}
            color={colors.info.DEFAULT}
          />
          <StatCard
            label="Upcoming"
            value={stats?.upcoming_appointments ?? 0}
            icon={<Calendar size={18} color={colors.warning.DEFAULT} strokeWidth={2} />}
            color={colors.warning.DEFAULT}
          />
        </View>

        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.gray[900], marginBottom: 12 }}>
          Quick Actions
        </Text>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          {quickActions.map(({ label, Icon, route, color }) => (
            <Pressable
              key={label}
              onPress={() => router.push(route as never)}
              style={{
                flex: 1,
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: 14,
                alignItems: 'center',
                gap: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.04,
                shadowRadius: 4,
                elevation: 1,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: color + '15',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={20} color={color} strokeWidth={2} />
              </View>
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.gray[700] }}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.gray[900], marginBottom: 12 }}>
          Recent Reports
        </Text>
        <View style={{ gap: 10, marginBottom: 24 }}>
          {(stats?.recent_reports ?? []).length === 0 ? (
            <Card variant="outlined" padding={16}>
              <Text style={{ fontSize: 14, color: colors.gray[500] }}>
                No reports yet. Record a session to generate your first report.
              </Text>
            </Card>
          ) : (
            stats!.recent_reports.map((report) => (
              <Pressable
                key={report.id}
                onPress={() => router.push(`/(tabs)/reports/${report.id}` as never)}
              >
                <Card variant="elevated" padding={14}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Avatar name={report.patient_name} size={40} />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{ fontSize: 15, fontWeight: '600', color: colors.gray[900] }}
                        numberOfLines={1}
                      >
                        {report.patient_name ?? 'Unknown patient'}
                      </Text>
                      <Text style={{ fontSize: 13, color: colors.gray[500], marginTop: 2 }}>
                        {timeAgo(report.created_at)}
                      </Text>
                    </View>
                    <Badge
                      label={report.status}
                      variant={
                        report.status === 'approved'
                          ? 'success'
                          : report.status === 'generating' || report.status === 'pending'
                            ? 'warning'
                            : 'default'
                      }
                    />
                  </View>
                </Card>
              </Pressable>
            ))
          )}
        </View>

        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.gray[900], marginBottom: 12 }}>
          Upcoming Appointments
        </Text>
        <View style={{ gap: 10 }}>
          {(stats?.upcoming_appointments_list ?? []).length === 0 ? (
            <Card variant="outlined" padding={16}>
              <Text style={{ fontSize: 14, color: colors.gray[500] }}>
                No upcoming appointments. Tap the Schedule action to add one.
              </Text>
            </Card>
          ) : (
            stats!.upcoming_appointments_list.map((appt) => (
              <Pressable
                key={appt.id}
                onPress={() => router.push(`/(tabs)/appointments/${appt.id}` as never)}
              >
                <Card variant="elevated" padding={14}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Avatar name={appt.patient_name} size={40} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: colors.gray[900] }}>
                        {appt.patient_name ?? 'Unknown patient'}
                      </Text>
                      <Text style={{ fontSize: 13, color: colors.gray[500], marginTop: 2 }}>
                        {formatDateTime(appt.scheduled_at)}
                      </Text>
                    </View>
                    <Badge
                      label={appt.status}
                      variant={appt.status === 'completed' ? 'info' : 'success'}
                    />
                  </View>
                </Card>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
