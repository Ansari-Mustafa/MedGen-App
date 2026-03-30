import { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, Users, ChevronRight } from 'lucide-react-native';
import { patientService } from '@/services';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { SearchBar } from '@/components/ui/SearchBar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { colors } from '@/constants/theme';
import { formatDate } from '@/utils/formatting';
import type { Patient } from '@/types/models';

export default function PatientsListScreen() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    patientService.getPatients().then((data) => {
      setPatients(data);
      setLoading(false);
    });
  }, []);

  const filtered = patients.filter(
    (p) =>
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.gray[50] }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
        {/* Header with back */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <ArrowLeft size={24} color={colors.gray[900]} strokeWidth={2} />
          </Pressable>
          <Text
            style={{
              fontSize: 26,
              fontWeight: '800',
              color: colors.gray[900],
              letterSpacing: -0.5,
              flex: 1,
            }}
          >
            Patients
          </Text>
          <Pressable
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: colors.primary[800],
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
          </Pressable>
        </View>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search patients..." />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 10 }}
        renderItem={({ item }) => (
          <Card variant="elevated" padding={14}>
            <Pressable
              onPress={() => router.push(`/(tabs)/more/patients/${item.id}` as never)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
            >
              <Avatar firstName={item.first_name} lastName={item.last_name} size={44} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.gray[900] }}>
                  {item.first_name} {item.last_name}
                </Text>
                <Text style={{ fontSize: 13, color: colors.gray[500], marginTop: 2 }}>
                  DOB: {formatDate(item.date_of_birth)}
                  {item.nhs_number ? ` · NHS: ${item.nhs_number}` : ''}
                </Text>
              </View>
              <ChevronRight size={18} color={colors.gray[300]} strokeWidth={2} />
            </Pressable>
          </Card>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 60, gap: 12 }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: colors.gray[100],
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={32} color={colors.gray[500]} strokeWidth={1.5} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.gray[700] }}>
              No patients found
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
