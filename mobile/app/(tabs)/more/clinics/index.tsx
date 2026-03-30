import { View, Text, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Building2 } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/theme';

const mockClinics = [
  { id: 1, name: 'Central Medical Practice', address: '10 Harley St, London W1G 9PF', phone: '+44 20 7946 0958' },
  { id: 2, name: 'Westside Health Centre', address: '25 Park Lane, Manchester M1 4RB', phone: '+44 161 234 5678' },
];

export default function ClinicsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.gray[50] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, gap: 12 }}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ArrowLeft size={24} color={colors.gray[900]} strokeWidth={2} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: colors.gray[900] }}>Clinics</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 10 }}>
        {mockClinics.map((clinic) => (
          <Card key={clinic.id} variant="elevated" padding={14}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: colors.success.light, alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={18} color={colors.success.DEFAULT} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.gray[900] }}>{clinic.name}</Text>
                <Text style={{ fontSize: 12, color: colors.gray[500], marginTop: 2 }}>{clinic.address}</Text>
              </View>
            </View>
          </Card>
        ))}
        <Button title="Add Clinic" onPress={() => {}} variant="outline" size="lg" fullWidth />
      </ScrollView>
    </SafeAreaView>
  );
}
