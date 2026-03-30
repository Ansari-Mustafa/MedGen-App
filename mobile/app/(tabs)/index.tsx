import { useEffect, useState } from 'react';
import { View, Text, ScrollView, SafeAreaView, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Mic, Users, FileText, Calendar } from 'lucide-react-native';
import { useAuthStore } from '@/stores/authStore';
import { dashboardService } from '@/services';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { colors } from '@/constants/theme';
import { getGreeting, formatDate, timeAgo } from '@/utils/formatting';
import type { DashboardStats } from '@/types/models';

const quickActions = [
  { label: 'Record', Icon: Mic, route: '/(tabs)/record', color: colors.primary[800] },
  { label: 'Patients', Icon: Users, route: '/(tabs)/more/patients', color: colors.info.DEFAULT },
  { label: 'Reports', Icon: FileText, route: '/(tabs)/reports', color: colors.success.DEFAULT },
  { label: 'Schedule', Icon: Calendar, route: '/(tabs)/appointments', color: colors.warning.DEFAULT },
];

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const data = await dashboardService.getDashboardStats();
      setStats(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading dashboard..." />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.gray[50] }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchStats();
            }}
            tintColor={colors.primary[800]}
          />
        }
      >
        {/* Greeting Header */}
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
            Dr {user?.last_name ?? 'Smith'}
          </Text>
        </View>

        {/* Stats Grid */}
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

        {/* Quick Actions */}
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

        {/* Recent Reports */}
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.gray[900], marginBottom: 12 }}>
          Recent Reports
        </Text>
        <View style={{ gap: 10, marginBottom: 24 }}>
          {stats?.recent_reports.map((report) => (
            <Card key={report.id} variant="elevated" padding={14}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Avatar
                  firstName={report.patient_name.split(' ')[0]}
                  lastName={report.patient_name.split(' ')[1] ?? ''}
                  size={40}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ fontSize: 15, fontWeight: '600', color: colors.gray[900] }}
                    numberOfLines={1}
                  >
                    {report.title}
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.gray[500], marginTop: 2 }}>
                    {report.patient_name} · {timeAgo(report.created_at)}
                  </Text>
                </View>
                <Badge
                  label={report.status}
                  variant={
                    report.status === 'approved'
                      ? 'success'
                      : report.status === 'generating'
                        ? 'warning'
                        : 'default'
                  }
                />
              </View>
            </Card>
          ))}
        </View>

        {/* Upcoming Appointments */}
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.gray[900], marginBottom: 12 }}>
          Upcoming Appointments
        </Text>
        <View style={{ gap: 10 }}>
          {stats?.upcoming_appointments_list.map((appt) => (
            <Card key={appt.id} variant="elevated" padding={14}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Avatar
                  firstName={appt.patient_name.split(' ')[0]}
                  lastName={appt.patient_name.split(' ')[1] ?? ''}
                  size={40}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: colors.gray[900] }}>
                    {appt.patient_name}
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.gray[500], marginTop: 2 }}>
                    {formatDate(appt.appointment_date)} · {appt.start_time}
                  </Text>
                </View>
                <Badge
                  label={appt.status}
                  variant={
                    appt.status === 'confirmed'
                      ? 'success'
                      : appt.status === 'scheduled'
                        ? 'info'
                        : 'default'
                  }
                />
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
