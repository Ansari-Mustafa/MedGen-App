import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import 'react-native-reanimated';
import '../global.css';

import { useAuthStore } from '@/stores/authStore';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { wsManager } from '@/lib/wsManager';

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

async function registerPushToken(updateProfile: (data: object) => Promise<void>) {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return;

    const tokenData = await Notifications.getExpoPushTokenAsync();
    await updateProfile({ expo_push_token: tokenData.data });
  } catch {
    // Push notifications optional — don't block app startup
  }
}

export default function RootLayout() {
  const { isAuthenticated, isLoading, user, loadStoredAuth, updateProfile } = useAuthStore();

  useEffect(() => {
    loadStoredAuth().finally(() => {
      SplashScreen.hideAsync();
    });
  }, []);

  const effectivelyAuthenticated = isAuthenticated && !!user;

  useEffect(() => {
    if (effectivelyAuthenticated) {
      wsManager.connect();
      registerPushToken(updateProfile);
    } else {
      wsManager.disconnect();
    }
  }, [effectivelyAuthenticated]);

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading..." />;
  }

  // Routes are registered unconditionally. The actual gating happens inside
  // each group's _layout.tsx via <Redirect>. Registering both groups here
  // without conditionals lets the redirect take effect before the target
  // screen mounts.
  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <StatusBar style="dark" />
    </QueryClientProvider>
  );
}
