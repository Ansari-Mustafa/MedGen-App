import { View, Text, type ViewStyle, type TextStyle } from 'react-native';
import { colors } from '@/constants/theme';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, { container: ViewStyle; text: TextStyle }> = {
  success: {
    container: { backgroundColor: colors.success.light },
    text: { color: colors.success.DEFAULT },
  },
  warning: {
    container: { backgroundColor: colors.warning.light },
    text: { color: colors.warning.DEFAULT },
  },
  error: {
    container: { backgroundColor: colors.error.light },
    text: { color: colors.error.DEFAULT },
  },
  info: {
    container: { backgroundColor: colors.info.light },
    text: { color: colors.info.DEFAULT },
  },
  default: {
    container: { backgroundColor: colors.gray[100] },
    text: { color: colors.gray[700] },
  },
};

export function Badge({ label, variant = 'default' }: BadgeProps) {
  const styles = variantStyles[variant];

  return (
    <View
      style={[
        {
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 100,
          alignSelf: 'flex-start',
        },
        styles.container,
      ]}
    >
      <Text style={[{ fontSize: 12, fontWeight: '600' }, styles.text]}>
        {label}
      </Text>
    </View>
  );
}
