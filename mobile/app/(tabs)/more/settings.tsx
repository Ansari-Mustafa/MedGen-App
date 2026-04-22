import { View, Text, SafeAreaView, ScrollView, Pressable, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';
import { useUIStore } from '@/stores/uiStore';
import { APP_VERSION } from '@/constants/config';

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, setTheme } = useUIStore();

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
          Settings
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
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
          Appearance
        </Text>
        <Card variant="elevated" padding={0}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingVertical: 13,
            }}
          >
            <Text style={{ fontSize: 15, color: colors.gray[900] }}>Dark Mode</Text>
            <Switch
              value={theme === 'dark'}
              onValueChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              trackColor={{ true: colors.primary[800] }}
            />
          </View>
        </Card>

        <Text
          style={{
            fontSize: 13,
            fontWeight: '600',
            color: colors.gray[500],
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginTop: 20,
            marginBottom: 8,
          }}
        >
          More
        </Text>
        <Card variant="outlined" padding={16}>
          <Text style={{ fontSize: 14, color: colors.gray[500] }}>
            Push notifications, biometric lock, and audio quality controls are coming soon.
          </Text>
        </Card>

        <Text style={{ fontSize: 12, color: colors.gray[500], textAlign: 'center', marginTop: 16 }}>
          MedGen v{APP_VERSION}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
