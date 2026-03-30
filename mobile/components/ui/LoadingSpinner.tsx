import { View, ActivityIndicator, Text } from 'react-native';
import { colors } from '@/constants/theme';

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
  size?: 'small' | 'large';
}

export function LoadingSpinner({
  message,
  fullScreen = false,
  size = 'large',
}: LoadingSpinnerProps) {
  const content = (
    <View style={{ alignItems: 'center', gap: 12 }}>
      <ActivityIndicator size={size} color={colors.primary[800]} />
      {message && (
        <Text style={{ fontSize: 14, color: colors.gray[500] }}>{message}</Text>
      )}
    </View>
  );

  if (fullScreen) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.gray[50],
        }}
      >
        {content}
      </View>
    );
  }

  return content;
}
