import * as SecureStore from 'expo-secure-store';

const KEYS = {
  ACCESS_TOKEN: 'medgen_access_token',
  REFRESH_TOKEN: 'medgen_refresh_token',
  USER_DATA: 'medgen_user_data',
  THEME: 'medgen_theme',
} as const;

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
}

export async function setAccessToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, token);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
}

export async function setRefreshToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, token);
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN);
  await SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN);
}

export async function getStoredUser(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.USER_DATA);
}

export async function setStoredUser(userData: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.USER_DATA, userData);
}

export async function clearStoredUser(): Promise<void> {
  await SecureStore.deleteItemAsync(KEYS.USER_DATA);
}

export async function getThemePreference(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.THEME);
}

export async function setThemePreference(theme: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.THEME, theme);
}
