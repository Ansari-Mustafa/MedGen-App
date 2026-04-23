import { useCallback, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Share2 } from 'lucide-react-native';

import { AudioPlayer } from '@/components/ui/AudioPlayer';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { colors } from '@/constants/theme';
import {
  getTranscript,
  getTranscriptAudioUrl,
} from '@/services/api/transcripts';
import type { Transcript } from '@/types/models';
import { formatDateTime, formatDuration } from '@/utils/formatting';

type TranscriptView = 'paragraphs' | 'utterances';

export default function TranscriptDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [view, setView] = useState<TranscriptView>('paragraphs');

  const { data: transcript, isLoading } = useQuery<Transcript>({
    queryKey: ['transcript', id],
    queryFn: () => getTranscript(id!),
    enabled: !!id,
  });

  const fetchAudioUrl = useCallback(async () => {
    const res = await getTranscriptAudioUrl(id!);
    return res.url;
  }, [id]);

  if (isLoading || !transcript) return <LoadingSpinner fullScreen />;

  const paragraphs = transcript.paragraphs_text ?? '';
  const utterances = transcript.utterances_text ?? '';
  const displayText = view === 'paragraphs' ? paragraphs : utterances;

  const shareAll = async () => {
    if (!displayText) return;
    try {
      await Share.share({ message: displayText });
    } catch {
      /* ignored */
    }
  };

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
        <Text
          style={{ flex: 1, fontSize: 18, fontWeight: '700', color: colors.gray[900] }}
          numberOfLines={1}
        >
          {transcript.patient_name ?? 'Transcript'}
        </Text>
        <Pressable onPress={shareAll} hitSlop={12} disabled={!displayText}>
          <Share2
            size={20}
            color={displayText ? colors.primary[800] : colors.gray[300]}
            strokeWidth={2}
          />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <Card variant="elevated" padding={16}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Avatar name={transcript.patient_name ?? '?'} size={48} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: colors.gray[900] }}>
                {transcript.patient_name ?? 'Unknown patient'}
              </Text>
              <Text style={{ fontSize: 13, color: colors.gray[500], marginTop: 2 }}>
                {formatDateTime(transcript.appointment_scheduled_at ?? transcript.created_at)}
                {transcript.duration_s
                  ? ` · ${formatDuration(transcript.duration_s)}`
                  : ''}
              </Text>
            </View>
          </View>
        </Card>

        <View style={{ height: 16 }} />
        <AudioPlayer title="Audio recording" getUrl={fetchAudioUrl} />

        <View style={{ marginTop: 20 }}>
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: colors.gray[100],
              borderRadius: 12,
              padding: 4,
              marginBottom: 12,
            }}
          >
            {(['paragraphs', 'utterances'] as const).map((key) => (
              <Pressable
                key={key}
                onPress={() => setView(key)}
                style={{
                  flex: 1,
                  paddingVertical: 9,
                  borderRadius: 10,
                  alignItems: 'center',
                  backgroundColor: view === key ? '#FFFFFF' : 'transparent',
                  ...(view === key
                    ? {
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.08,
                        shadowRadius: 4,
                      }
                    : {}),
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: view === key ? colors.gray[900] : colors.gray[500],
                    textTransform: 'capitalize',
                  }}
                >
                  {key}
                </Text>
              </Pressable>
            ))}
          </View>
          <Card variant="outlined" padding={14}>
            {displayText ? (
              <Text
                selectable
                style={{ fontSize: 14, lineHeight: 22, color: colors.gray[900] }}
              >
                {displayText}
              </Text>
            ) : (
              <Text style={{ fontSize: 13, color: colors.gray[500] }}>
                No {view} available.
              </Text>
            )}
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
