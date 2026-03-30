import { View, Text } from 'react-native';
import { getAvatarColor } from '@/constants/theme';
import { getInitials } from '@/utils/formatting';

interface AvatarProps {
  firstName: string;
  lastName: string;
  size?: number;
}

export function Avatar({ firstName, lastName, size = 44 }: AvatarProps) {
  const bg = getAvatarColor(firstName);
  const initials = getInitials(firstName, lastName);
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
