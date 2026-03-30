import { View, Text, SafeAreaView, ScrollView, Pressable, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';
import { useUIStore } from '@/stores/uiStore';

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, setTheme } = useUIStore();

  const sections = [
    {
      title: 'Appearance',
      items: [
        {
          label: 'Dark Mode',
          type: 'switch' as const,
          value: theme === 'dark',
          onToggle: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
        },
      ],
    },
    {
      title: 'Recording',
      items: [
        { label: 'Audio Quality', type: 'value' as const, value: 'High' },
        { label: 'Auto-detect Appointment', type: 'switch' as const, value: true, onToggle: () => {} },
      ],
    },
    {
      title: 'Notifications',
      items: [
        { label: 'Push Notifications', type: 'switch' as const, value: true, onToggle: () => {} },
        { label: 'Report Ready Alerts', type: 'switch' as const, value: true, onToggle: () => {} },
        { label: 'Appointment Reminders', type: 'switch' as const, value: true, onToggle: () => {} },
      ],
    },
    {
      title: 'Security',
      items: [
        { label: 'Face ID / Touch ID', type: 'switch' as const, value: false, onToggle: () => {} },
        { label: 'Auto-Lock', type: 'value' as const, value: '5 minutes' },
      ],
    },
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
          Settings
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
        {sections.map((section) => (
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
                <View
                  key={item.label}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 16,
                    paddingVertical: 13,
                    borderBottomWidth: idx < section.items.length - 1 ? 1 : 0,
                    borderBottomColor: colors.gray[100],
                  }}
                >
                  <Text style={{ fontSize: 15, color: colors.gray[900] }}>{item.label}</Text>
                  {item.type === 'switch' ? (
                    <Switch
                      value={item.value as boolean}
                      onValueChange={item.onToggle}
                      trackColor={{ true: colors.primary[800] }}
                    />
                  ) : (
                    <Text style={{ fontSize: 14, color: colors.gray[500] }}>
                      {item.value as string}
                    </Text>
                  )}
                </View>
              ))}
            </Card>
          </View>
        ))}

        <Text style={{ fontSize: 12, color: colors.gray[500], textAlign: 'center', marginTop: 12 }}>
          MedGen AI v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
