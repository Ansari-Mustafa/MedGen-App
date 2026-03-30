import { View, TextInput, Pressable } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { colors } from '@/constants/theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search...',
}: SearchBarProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.gray[100],
        borderRadius: 12,
        paddingHorizontal: 14,
        minHeight: 44,
        gap: 10,
      }}
    >
      <Search size={18} color={colors.gray[500]} strokeWidth={2} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.gray[500]}
        style={{
          flex: 1,
          fontSize: 16,
          color: colors.gray[900],
          paddingVertical: 10,
        }}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChangeText('')} hitSlop={8}>
          <X size={18} color={colors.gray[500]} strokeWidth={2} />
        </Pressable>
      )}
    </View>
  );
}
