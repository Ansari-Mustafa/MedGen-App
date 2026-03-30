import { Pressable, Text, ActivityIndicator, type ViewStyle, type TextStyle } from 'react-native';
import { colors } from '@/constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

const sizeStyles: Record<ButtonSize, { container: ViewStyle; text: TextStyle }> = {
  sm: {
    container: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
    text: { fontSize: 13, fontWeight: '600' },
  },
  md: {
    container: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
    text: { fontSize: 15, fontWeight: '600' },
  },
  lg: {
    container: { paddingVertical: 16, paddingHorizontal: 24, borderRadius: 12 },
    text: { fontSize: 17, fontWeight: '600' },
  },
};

const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: TextStyle }> = {
  primary: {
    container: { backgroundColor: colors.primary[800] },
    text: { color: '#FFFFFF' },
  },
  secondary: {
    container: { backgroundColor: colors.primary[100] },
    text: { color: colors.primary[800] },
  },
  outline: {
    container: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.gray[200] },
    text: { color: colors.gray[900] },
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    text: { color: colors.primary[800] },
  },
  destructive: {
    container: { backgroundColor: colors.error.DEFAULT },
    text: { color: '#FFFFFF' },
  },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
}: ButtonProps) {
  const vStyle = variantStyles[variant];
  const sStyle = sizeStyles[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          ...(fullWidth ? { width: '100%' as unknown as number } : {}),
        },
        vStyle.container,
        sStyle.container,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={vStyle.text.color as string} />
      ) : (
        <>
          {icon}
          <Text style={[sStyle.text, vStyle.text]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}
