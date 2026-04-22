import { View, Text, SafeAreaView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Sparkles } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';

interface ComingSoonProps {
  title: string;
  subtitle?: string;
}

export function ComingSoon({ title, subtitle }: ComingSoonProps) {
  const router = useRouter();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.gray[50] }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 12,
          gap: 12,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ArrowLeft size={24} color={colors.gray[900]} strokeWidth={2} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: colors.gray[900] }}>
          {title}
        </Text>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: colors.primary[100],
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Sparkles size={32} color={colors.primary[800]} strokeWidth={1.5} />
        </View>
        <Card variant="outlined" padding={20}>
          <View style={{ alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.gray[900] }}>
              Coming soon
            </Text>
            {subtitle && (
              <Text style={{ fontSize: 14, color: colors.gray[500], textAlign: 'center' }}>
                {subtitle}
              </Text>
            )}
          </View>
        </Card>
      </View>
    </SafeAreaView>
  );
}
