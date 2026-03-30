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

export default function SignupScreen() {
  const router = useRouter();
  const { signup, isLoading, error, clearError } = useAuthStore();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [specialty, setSpecialty] = useState('');

  const handleSignup = async () => {
    clearError();
    await signup({
      email,
      password,
      first_name: firstName,
      last_name: lastName,
      title: 'Dr',
      specialty,
    });
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
              Create Account
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: colors.gray[500],
                marginTop: 6,
              }}
            >
              Start generating reports in minutes
            </Text>
          </View>

          {/* Form */}
          <View style={{ gap: 16 }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Input
                  label="First Name"
                  placeholder="Sarah"
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Last Name"
                  placeholder="Smith"
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                />
              </View>
            </View>

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
              label="Specialty"
              placeholder="e.g. General Practice"
              value={specialty}
              onChangeText={setSpecialty}
              autoCapitalize="words"
            />

            <Input
              label="Password"
              placeholder="Create a strong password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              secureToggle
            />

            {error && (
              <Text style={{ color: colors.error.DEFAULT, fontSize: 14, textAlign: 'center' }}>
                {error}
              </Text>
            )}

            <Button
              title="Create Account"
              onPress={handleSignup}
              loading={isLoading}
              size="lg"
              fullWidth
            />
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
              Already have an account?
            </Text>
            <Pressable onPress={() => router.replace('/(auth)/login')}>
              <Text style={{ color: colors.primary[800], fontSize: 14, fontWeight: '600' }}>
                Sign In
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
