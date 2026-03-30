import { View, Text, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Mic, FileText, Sparkles, Download } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/theme';

const features = [
  { label: 'Record', Icon: Mic },
  { label: 'Transcribe', Icon: FileText },
  { label: 'Generate', Icon: Sparkles },
  { label: 'Export', Icon: Download },
];

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View
        style={{
          flex: 1,
          paddingHorizontal: 24,
          justifyContent: 'space-between',
          paddingBottom: 32,
        }}
      >
        {/* Hero section */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
          {/* Logo */}
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              backgroundColor: colors.primary[800],
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 8,
            }}
          >
            <Text style={{ fontSize: 32, color: '#FFFFFF', fontWeight: '700' }}>M</Text>
          </View>

          <Text
            style={{
              fontSize: 32,
              fontWeight: '800',
              color: colors.gray[900],
              textAlign: 'center',
              letterSpacing: -0.5,
            }}
          >
            MedGen AI
          </Text>

          <Text
            style={{
              fontSize: 17,
              color: colors.gray[500],
              textAlign: 'center',
              lineHeight: 24,
              maxWidth: 300,
            }}
          >
            Transform consultations into professional medical reports with AI
          </Text>

          {/* Feature pills */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 24 }}>
            {features.map(({ label, Icon }) => (
              <View
                key={label}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: colors.primary[50],
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 100,
                }}
              >
                <Icon size={14} color={colors.primary[800]} strokeWidth={2.5} />
                <Text style={{ color: colors.primary[800], fontWeight: '600', fontSize: 14 }}>
                  {label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Action buttons */}
        <View style={{ gap: 12 }}>
          <Button
            title="Sign In"
            onPress={() => router.push('/(auth)/login')}
            variant="primary"
            size="lg"
            fullWidth
          />
          <Button
            title="Create Account"
            onPress={() => router.push('/(auth)/signup')}
            variant="outline"
            size="lg"
            fullWidth
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
