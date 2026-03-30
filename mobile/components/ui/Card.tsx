import { View, type ViewProps, type ViewStyle } from 'react-native';
import { colors } from '@/constants/theme';

type CardVariant = 'elevated' | 'outlined' | 'filled';

interface CardProps extends ViewProps {
  variant?: CardVariant;
  padding?: number;
}

const variantStyles: Record<CardVariant, ViewStyle> = {
  elevated: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  outlined: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  filled: {
    backgroundColor: colors.gray[50],
    borderRadius: 16,
  },
};

export function Card({
  variant = 'elevated',
  padding = 16,
  style,
  children,
  ...rest
}: CardProps) {
  return (
    <View
      style={[variantStyles[variant], { padding }, style as ViewStyle]}
      {...rest}
    >
      {children}
    </View>
  );
}
