import { View, Text, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/theme';

export default function SubscriptionScreen() {
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
          Subscription
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
        {/* Current plan */}
        <Card variant="elevated" padding={20}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.gray[900] }}>
              Professional Plan
            </Text>
            <Badge label="Active" variant="success" />
          </View>

          {/* Usage bars */}
          {[
            { label: 'Reports', used: 23, limit: 50 },
            { label: 'Recordings', used: 18, limit: 50 },
            { label: 'Storage', used: 245, limit: 500, unit: 'MB' },
          ].map((usage) => (
            <View key={usage.label} style={{ marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontSize: 13, color: colors.gray[500] }}>{usage.label}</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.gray[700] }}>
                  {usage.used}/{usage.limit} {usage.unit ?? ''}
                </Text>
              </View>
              <View style={{ height: 6, backgroundColor: colors.gray[100], borderRadius: 3 }}>
                <View
                  style={{
                    height: 6,
                    width: `${(usage.used / usage.limit) * 100}%`,
                    backgroundColor: usage.used / usage.limit > 0.8 ? colors.warning.DEFAULT : colors.primary[800],
                    borderRadius: 3,
                  }}
                />
              </View>
            </View>
          ))}
        </Card>

        {/* Redeem code */}
        <Card variant="outlined" padding={16} style={{ marginTop: 16 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.gray[900], marginBottom: 4 }}>
            Have a promo code?
          </Text>
          <Text style={{ fontSize: 13, color: colors.gray[500], marginBottom: 12 }}>
            Enter a subscription code to activate or extend your plan
          </Text>
          <Button title="Redeem Code" onPress={() => {}} variant="secondary" />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
