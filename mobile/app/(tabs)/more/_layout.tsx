import { Stack } from 'expo-router';

export default function MoreLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="patients" />
      <Stack.Screen name="transcripts" />
      <Stack.Screen name="templates" />
      <Stack.Screen name="clinics" />
      <Stack.Screen name="availability" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="subscription" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
