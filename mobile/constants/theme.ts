import { Platform } from 'react-native';

export const colors = {
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A5F',
  },
  success: { DEFAULT: '#059669', light: '#D1FAE5' },
  warning: { DEFAULT: '#D97706', light: '#FEF3C7' },
  error: { DEFAULT: '#DC2626', light: '#FEE2E2' },
  info: { DEFAULT: '#0891B2', light: '#CFFAFE' },
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    500: '#6B7280',
    700: '#374151',
    900: '#111827',
    950: '#0C0F14',
  },
} as const;

export const lightTheme = {
  background: colors.gray[50],
  surface: '#FFFFFF',
  textPrimary: colors.gray[900],
  textSecondary: colors.gray[700],
  textMuted: colors.gray[500],
  border: colors.gray[200],
  divider: colors.gray[100],
  primary: colors.primary[800],
} as const;

export const darkTheme = {
  background: '#0C0F14',
  surface: '#1A1F2E',
  textPrimary: '#F0F4FF',
  textSecondary: '#A0AABE',
  textMuted: '#6B7591',
  border: '#2A3040',
  divider: '#222D42',
  primary: colors.primary[500],
} as const;

// Avatar color rotation based on first letter of name
const avatarColors: Record<string, string> = {
  A: '#3B82F6', B: '#3B82F6', C: '#3B82F6', D: '#3B82F6', E: '#3B82F6',
  F: '#0891B2', G: '#0891B2', H: '#0891B2', I: '#0891B2', J: '#0891B2',
  K: '#059669', L: '#059669', M: '#059669', N: '#059669', O: '#059669',
  P: '#D97706', Q: '#D97706', R: '#D97706', S: '#D97706', T: '#D97706',
  U: '#DC2626', V: '#DC2626', W: '#DC2626', X: '#DC2626', Y: '#DC2626',
  Z: '#7C3AED',
};

export function getAvatarColor(name: string): string {
  const letter = name.charAt(0).toUpperCase();
  return avatarColors[letter] ?? colors.primary[500];
}

export const Colors = {
  light: {
    text: lightTheme.textPrimary,
    background: lightTheme.background,
    tint: lightTheme.primary,
    icon: colors.gray[500],
    tabIconDefault: colors.gray[500],
    tabIconSelected: lightTheme.primary,
  },
  dark: {
    text: darkTheme.textPrimary,
    background: darkTheme.background,
    tint: darkTheme.primary,
    icon: '#6B7591',
    tabIconDefault: '#6B7591',
    tabIconSelected: darkTheme.primary,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
});
