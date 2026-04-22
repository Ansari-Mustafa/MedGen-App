import { View, StyleSheet } from 'react-native';
import { Tabs, useRouter, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Mic } from 'lucide-react-native';
import { HapticTab } from '@/components/haptic-tab';
import { Colors, colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Pressable } from 'react-native';
import { useAuthStore } from '@/stores/authStore';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const tabIcons: Record<string, { active: IoniconsName; inactive: IoniconsName }> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Appointments: { active: 'calendar', inactive: 'calendar-outline' },
  Reports: { active: 'document-text', inactive: 'document-text-outline' },
  More: { active: 'grid', inactive: 'grid-outline' },
};

function TabIcon({ name, focused, color }: { name: string; focused: boolean; color: string }) {
  const icon = tabIcons[name];
  if (!icon) return null;
  return <Ionicons name={focused ? icon.active : icon.inactive} size={24} color={color} />;
}

function RecordFAB() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push('/(tabs)/record')}
      style={({ pressed }) => [
        styles.fab,
        { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] },
      ]}
    >
      <View style={styles.fabInner}>
        <Mic size={26} color="#FFFFFF" strokeWidth={2.5} />
      </View>
    </Pressable>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, user, isLoading } = useAuthStore();

  // Auth guard: only authenticated users with a loaded profile may see tabs.
  // This runs BEFORE any tab screen mounts, so no protected data is fetched.
  if (!isLoading && !(isAuthenticated && user)) {
    return <Redirect href="/(auth)/welcome" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: colors.gray[100],
          height: 88,
          paddingBottom: 28,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => <TabIcon name="Home" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Appts',
          tabBarIcon: ({ focused, color }) => <TabIcon name="Appointments" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="record"
        options={{
          title: '',
          tabBarIcon: () => null,
          tabBarButton: () => (
            <View style={styles.fabWrapper}>
              <RecordFAB />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ focused, color }) => <TabIcon name="Reports" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ focused, color }) => <TabIcon name="More" focused={focused} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  fabWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
  },
  fabInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[800],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary[800],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
