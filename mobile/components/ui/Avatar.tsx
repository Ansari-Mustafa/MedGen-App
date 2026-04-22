import { View, Text } from 'react-native';
import { getAvatarColor } from '@/constants/theme';
import { getInitialsFromName } from '@/utils/formatting';

interface AvatarProps {
  name?: string | null;
  size?: number;
}

export function Avatar({ name, size = 44 }: AvatarProps) {
  const display = name && name.trim().length > 0 ? name : '?';
  const bg = getAvatarColor(display);
  const initials = getInitialsFromName(display);
  const fontSize = size * 0.38;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          color: '#FFFFFF',
          fontSize,
          fontWeight: '700',
          letterSpacing: 0.5,
        }}
      >
        {initials}
      </Text>
    </View>
  );
}
