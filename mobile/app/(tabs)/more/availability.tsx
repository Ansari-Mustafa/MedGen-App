import { View, Text, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function AvailabilityScreen() {
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
          Availability
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
        <Text style={{ fontSize: 14, color: colors.gray[500], marginBottom: 16 }}>
          Set your weekly schedule for appointment bookings
        </Text>

        <Card variant="elevated" padding={0}>
          {days.map((day, idx) => (
            <View
              key={day}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderBottomWidth: idx < days.length - 1 ? 1 : 0,
                borderBottomColor: colors.gray[100],
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.gray[900] }}>
                {day}
              </Text>
              <Text style={{ fontSize: 14, color: colors.gray[500] }}>
                9:00 AM - 5:00 PM
              </Text>
            </View>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
