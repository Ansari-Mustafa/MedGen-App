import { useState } from 'react';
import { View, Text, SafeAreaView, FlatList, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Plus, Users, ChevronRight } from 'lucide-react-native';
import { getPatients } from '@/services/api/patients';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { SearchBar } from '@/components/ui/SearchBar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { colors } from '@/constants/theme';
import { formatDate } from '@/utils/formatting';
import type { Patient } from '@/types/models';

export default function PatientsListScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const { data: patients = [], isLoading, refetch, isRefetching } = useQuery<Patient[]>({
    queryKey: ['patients'],
    queryFn: getPatients,
  });

  const filtered = patients.filter(
    (p) =>
      p.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (p.email?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  if (isLoading) return <LoadingSpinner fullScreen />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.gray[50] }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
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
            onPress={() => router.push('/(tabs)/more/patients/new' as never)}
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
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 10 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        renderItem={({ item }) => (
          <Card variant="elevated" padding={14}>
            <Pressable
              onPress={() => router.push(`/(tabs)/more/patients/${item.id}` as never)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
            >
              <Avatar name={item.full_name} size={44} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.gray[900] }}>
                  {item.full_name}
                </Text>
                <Text style={{ fontSize: 13, color: colors.gray[500], marginTop: 2 }}>
                  DOB: {formatDate(item.dob)}
                  {item.nino ? ` · NI: ${item.nino}` : ''}
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
              No patients yet
            </Text>
            <Text style={{ fontSize: 14, color: colors.gray[500] }}>
              Tap + to add your first patient
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
