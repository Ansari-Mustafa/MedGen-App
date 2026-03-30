import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  type TextInputProps,
} from 'react-native';
import { colors } from '@/constants/theme';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  secureToggle?: boolean;
}

export function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  secureToggle,
  secureTextEntry,
  ...rest
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secureTextEntry ?? false);

  const borderColor = error
    ? colors.error.DEFAULT
    : focused
      ? colors.primary[800]
      : colors.gray[200];

  return (
    <View style={{ gap: 6 }}>
      {label && (
        <Text
          style={{
            fontSize: 14,
            fontWeight: '500',
            color: colors.gray[700],
          }}
        >
          {label}
        </Text>
      )}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1.5,
          borderColor,
          borderRadius: 12,
          backgroundColor: '#FFFFFF',
          paddingHorizontal: 14,
          minHeight: 48,
          gap: 10,
        }}
      >
        {leftIcon}

        <TextInput
          {...rest}
          secureTextEntry={secureToggle ? hidden : secureTextEntry}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          placeholderTextColor={colors.gray[500]}
          style={{
            flex: 1,
            fontSize: 16,
            color: colors.gray[900],
            paddingVertical: 12,
          }}
        />

        {secureToggle && (
          <Pressable onPress={() => setHidden(!hidden)}>
            <Text style={{ color: colors.primary[600], fontSize: 13, fontWeight: '600' }}>
              {hidden ? 'Show' : 'Hide'}
            </Text>
          </Pressable>
        )}
        {rightIcon}
      </View>

      {error && (
        <Text style={{ fontSize: 12, color: colors.error.DEFAULT }}>{error}</Text>
      )}
      {helperText && !error && (
        <Text style={{ fontSize: 12, color: colors.gray[500] }}>{helperText}</Text>
      )}
    </View>
  );
}
