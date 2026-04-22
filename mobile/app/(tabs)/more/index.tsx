import { View, Text, SafeAreaView, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Users,
  ScrollText,
  ClipboardList,
  Building2,
  Clock,
  User,
  CreditCard,
  Settings,
  ChevronRight,
  LogOut,
} from 'lucide-react-native';
import { useAuthStore } from '@/stores/authStore';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';

interface MenuItem {
  label: string;
  Icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  route: string;
  description?: string;
  iconColor: string;
  iconBg: string;
}

const menuSections: { title: string; items: MenuItem[] }[] = [
  {
    title: 'Clinical',
    items: [
      { label: 'Patients', Icon: Users, route: '/(tabs)/more/patients', description: 'Manage patient records', iconColor: colors.primary[800], iconBg: colors.primary[100] },
      { label: 'Transcripts', Icon: ScrollText, route: '/(tabs)/more/transcripts', description: 'View transcriptions', iconColor: colors.info.DEFAULT, iconBg: colors.info.light },
      { label: 'Templates', Icon: ClipboardList, route: '/(tabs)/more/templates', description: 'Report templates', iconColor: colors.success.DEFAULT, iconBg: colors.success.light },
    ],
  },
  {
    title: 'Practice',
    items: [
      { label: 'Clinics', Icon: Building2, route: '/(tabs)/more/clinics', description: 'Manage clinics', iconColor: colors.warning.DEFAULT, iconBg: colors.warning.light },
      { label: 'Availability', Icon: Clock, route: '/(tabs)/more/availability', description: 'Set schedule', iconColor: colors.primary[600], iconBg: colors.primary[50] },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Profile', Icon: User, route: '/(tabs)/more/profile', description: 'Personal details', iconColor: colors.gray[700], iconBg: colors.gray[100] },
      { label: 'Subscription', Icon: CreditCard, route: '/(tabs)/more/subscription', description: 'Plan & billing', iconColor: colors.success.DEFAULT, iconBg: colors.success.light },
      { label: 'Settings', Icon: Settings, route: '/(tabs)/more/settings', description: 'App preferences', iconColor: colors.gray[700], iconBg: colors.gray[100] },
    ],
  },
];

export default function MoreScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.gray[50] }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
        {/* Profile header */}
        <Pressable
          onPress={() => router.push('/(tabs)/more/profile' as never)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            paddingVertical: 20,
          }}
        >
          <Avatar name={user?.full_name ?? 'Doctor'} size={56} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.gray[900] }}>
              {user?.full_name ?? '-'}
            </Text>
            <Text style={{ fontSize: 14, color: colors.gray[500], marginTop: 2 }}>
              {user?.role === 'secretary' ? 'Secretary' : 'Doctor'}
            </Text>
          </View>
          <ChevronRight size={20} color={colors.gray[300]} strokeWidth={2} />
        </Pressable>

        {/* Menu sections */}
        {menuSections.map((section) => (
          <View key={section.title} style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: colors.gray[500],
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                marginBottom: 8,
              }}
            >
              {section.title}
            </Text>
            <Card variant="elevated" padding={0}>
              {section.items.map((item, idx) => (
                <Pressable
                  key={item.label}
                  onPress={() => router.push(item.route as never)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    gap: 12,
                    borderBottomWidth: idx < section.items.length - 1 ? 1 : 0,
                    borderBottomColor: colors.gray[100],
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: item.iconBg,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <item.Icon size={18} color={item.iconColor} strokeWidth={2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: colors.gray[900] }}>
                      {item.label}
                    </Text>
                    {item.description && (
                      <Text style={{ fontSize: 12, color: colors.gray[500], marginTop: 1 }}>
                        {item.description}
                      </Text>
                    )}
                  </View>
                  <ChevronRight size={18} color={colors.gray[300]} strokeWidth={2} />
                </Pressable>
              ))}
            </Card>
          </View>
        ))}

        {/* Sign out */}
        <Pressable
          onPress={() => logout()}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingVertical: 14,
            backgroundColor: colors.error.light,
            borderRadius: 12,
          }}
        >
          <LogOut size={18} color={colors.error.DEFAULT} strokeWidth={2} />
          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.error.DEFAULT }}>
            Sign Out
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
