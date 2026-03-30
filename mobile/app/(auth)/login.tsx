import { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { colors } from '@/constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    clearError();
    await login({ email, password });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: 32,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back button */}
          <Pressable onPress={() => router.back()} hitSlop={12} style={{ marginBottom: 24, width: 40 }}>
            <ArrowLeft size={24} color={colors.gray[900]} strokeWidth={2} />
          </Pressable>

          {/* Header */}
          <View style={{ marginBottom: 32 }}>
            <Text
              style={{
                fontSize: 28,
                fontWeight: '800',
                color: colors.gray[900],
                letterSpacing: -0.5,
              }}
            >
              Welcome back
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: colors.gray[500],
                marginTop: 6,
              }}
            >
              Sign in to continue to MedGen
            </Text>
          </View>

          {/* Form */}
          <View style={{ gap: 20 }}>
            <Input
              label="Email"
              placeholder="doctor@clinic.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              secureToggle
              autoComplete="password"
            />

            {error && (
              <Text style={{ color: colors.error.DEFAULT, fontSize: 14, textAlign: 'center' }}>
                {error}
              </Text>
            )}

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={isLoading}
              size="lg"
              fullWidth
            />

            <Pressable style={{ alignSelf: 'center', paddingVertical: 8 }}>
              <Text style={{ color: colors.primary[600], fontSize: 14, fontWeight: '600' }}>
                Forgot password?
              </Text>
            </Pressable>
          </View>

          {/* Footer */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              marginTop: 'auto',
              paddingTop: 32,
              gap: 4,
            }}
          >
            <Text style={{ color: colors.gray[500], fontSize: 14 }}>
              Don't have an account?
            </Text>
            <Pressable onPress={() => router.replace('/(auth)/signup')}>
              <Text style={{ color: colors.primary[800], fontSize: 14, fontWeight: '600' }}>
                Sign Up
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
