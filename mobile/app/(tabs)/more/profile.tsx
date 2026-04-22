import { View, Text, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useAuthStore } from '@/stores/authStore';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { colors } from '@/constants/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const profileRows = [
    { label: 'Full Name', value: user?.full_name ?? '-' },
    { label: 'Email', value: user?.email ?? '-' },
    { label: 'Phone', value: user?.phone ?? '-' },
    { label: 'Role', value: user?.role ?? '-' },
  ];

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
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: colors.gray[900] }}>
          Profile
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
        <View style={{ alignItems: 'center', paddingVertical: 20, gap: 10 }}>
          <Avatar name={user?.full_name ?? 'Doctor'} size={80} />
          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.gray[900] }}>
            {user?.full_name ?? '-'}
          </Text>
          <Text style={{ fontSize: 14, color: colors.gray[500] }}>{user?.email}</Text>
        </View>

        <Card variant="elevated" padding={0}>
          {profileRows.map((row, idx) => (
            <View
              key={row.label}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 13,
                borderBottomWidth: idx < profileRows.length - 1 ? 1 : 0,
                borderBottomColor: colors.gray[100],
              }}
            >
              <Text style={{ fontSize: 14, color: colors.gray[500] }}>{row.label}</Text>
              <Text style={{ fontSize: 14, fontWeight: '500', color: colors.gray[900] }}>
                {row.value}
              </Text>
            </View>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
