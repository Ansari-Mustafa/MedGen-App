import { useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ChevronRight, FileAudio, Mic } from 'lucide-react-native';

import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { SearchBar } from '@/components/ui/SearchBar';
import { colors } from '@/constants/theme';
import { getTranscripts } from '@/services/api/transcripts';
import type { TranscriptListItem } from '@/types/models';
import { formatDateTime, formatDuration } from '@/utils/formatting';

export default function TranscriptsListScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const {
    data: transcripts = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<TranscriptListItem[]>({
    queryKey: ['transcripts'],
    queryFn: getTranscripts,
  });

  const filtered = transcripts.filter((t) => {
    if (!search) return true;
    const needle = search.toLowerCase();
    return (
      (t.patient_name ?? '').toLowerCase().includes(needle) ||
      (t.snippet ?? '').toLowerCase().includes(needle)
    );
  });

  if (isLoading) return <LoadingSpinner fullScreen />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.gray[50] }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <ArrowLeft size={24} color={colors.gray[900]} strokeWidth={2} />
          </Pressable>
          <Text
            style={{
              flex: 1,
              fontSize: 26,
              fontWeight: '800',
              color: colors.gray[900],
              letterSpacing: -0.5,
            }}
          >
            Transcripts
          </Text>
        </View>
        {transcripts.length > 0 && (
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Search transcripts..."
          />
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 10 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        renderItem={({ item }) => (
          <Card variant="elevated" padding={14}>
            <Pressable
              onPress={() => router.push(`/(tabs)/more/transcripts/${item.id}` as never)}
              style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: colors.primary[100],
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileAudio size={20} color={colors.primary[800]} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 15, fontWeight: '600', color: colors.gray[900] }}
                  numberOfLines={1}
                >
                  {item.patient_name ?? 'Unknown patient'}
                </Text>
                <Text style={{ fontSize: 12, color: colors.gray[500], marginTop: 2 }}>
                  {formatDateTime(item.appointment_scheduled_at ?? item.created_at)}
                  {item.duration_s ? ` · ${formatDuration(item.duration_s)}` : ''}
                </Text>
                {item.snippet ? (
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.gray[700],
                      marginTop: 6,
                      lineHeight: 18,
                    }}
                    numberOfLines={2}
                  >
                    {item.snippet}
                  </Text>
                ) : null}
              </View>
              <ChevronRight size={18} color={colors.gray[300]} strokeWidth={2} />
            </Pressable>
          </Card>
        )}
        ListEmptyComponent={
          <View
            style={{
              alignItems: 'center',
              paddingTop: 60,
              paddingHorizontal: 24,
              gap: 12,
            }}
          >
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
              <Mic size={32} color={colors.gray[500]} strokeWidth={1.5} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.gray[700] }}>
              No transcripts yet
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.gray[500],
                textAlign: 'center',
                lineHeight: 20,
              }}
            >
              Transcripts appear after you record or upload a consultation.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
