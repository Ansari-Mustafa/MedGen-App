import { useState } from 'react';
import { View, Text, SafeAreaView, Pressable } from 'react-native';
import { Mic, Upload, User, ChevronRight, Square } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';
import { formatDuration } from '@/utils/formatting';

type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped';

export default function RecordScreen() {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [duration] = useState(0);
  const [selectedMode, setSelectedMode] = useState<'record' | 'upload'>('record');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.gray[50] }}>
      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        {/* Header */}
        <View style={{ paddingTop: 16, paddingBottom: 24 }}>
          <Text
            style={{
              fontSize: 26,
              fontWeight: '800',
              color: colors.gray[900],
              letterSpacing: -0.5,
            }}
          >
            Record Session
          </Text>
          <Text style={{ fontSize: 15, color: colors.gray[500], marginTop: 4 }}>
            Record or upload a consultation
          </Text>
        </View>

        {/* Mode Toggle */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: colors.gray[100],
            borderRadius: 12,
            padding: 4,
            marginBottom: 24,
          }}
        >
          {([
            { key: 'record' as const, label: 'Record', Icon: Mic },
            { key: 'upload' as const, label: 'Upload', Icon: Upload },
          ]).map(({ key, label, Icon }) => (
            <Pressable
              key={key}
              onPress={() => setSelectedMode(key)}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                paddingVertical: 10,
                borderRadius: 10,
                backgroundColor: selectedMode === key ? '#FFFFFF' : 'transparent',
                ...(selectedMode === key
                  ? {
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.08,
                      shadowRadius: 4,
                    }
                  : {}),
              }}
            >
              <Icon
                size={16}
                color={selectedMode === key ? colors.gray[900] : colors.gray[500]}
                strokeWidth={2}
              />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: selectedMode === key ? colors.gray[900] : colors.gray[500],
                }}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Patient selector */}
        <Card variant="outlined" padding={14}>
          <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.primary[100],
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <User size={20} color={colors.primary[800]} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.gray[900] }}>
                Select Patient
              </Text>
              <Text style={{ fontSize: 13, color: colors.gray[500] }}>
                Choose a patient for this session
              </Text>
            </View>
            <ChevronRight size={20} color={colors.gray[300]} strokeWidth={2} />
          </Pressable>
        </Card>

        {/* Recording area */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 }}>
          {selectedMode === 'record' ? (
            <>
              {/* Waveform placeholder */}
              <View
                style={{
                  width: '100%',
                  height: 80,
                  backgroundColor: colors.primary[50],
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: colors.primary[400], fontSize: 13, letterSpacing: 2 }}>
                  {recordingState === 'idle'
                    ? 'Tap to start recording'
                    : '\u2581\u2583\u2585\u2587\u2585\u2583\u2581\u2583\u2585\u2587\u2585\u2583\u2581\u2583\u2585\u2587'}
                </Text>
              </View>

              {/* Timer */}
              <Text
                style={{
                  fontSize: 48,
                  fontWeight: '300',
                  color: colors.gray[900],
                  fontVariant: ['tabular-nums'],
                }}
              >
                {formatDuration(duration)}
              </Text>

              {/* Record button */}
              <Pressable
                onPress={() => {
                  if (recordingState === 'idle') setRecordingState('recording');
                  else if (recordingState === 'recording') setRecordingState('paused');
                  else if (recordingState === 'paused') setRecordingState('recording');
                }}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor:
                    recordingState === 'recording'
                      ? colors.error.DEFAULT
                      : colors.primary[800],
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor:
                    recordingState === 'recording'
                      ? colors.error.DEFAULT
                      : colors.primary[800],
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                }}
              >
                {recordingState === 'recording' ? (
                  <Square size={24} color="#FFFFFF" fill="#FFFFFF" strokeWidth={0} />
                ) : (
                  <Mic size={32} color="#FFFFFF" strokeWidth={2} />
                )}
              </Pressable>

              {recordingState !== 'idle' && (
                <Button
                  title="Finish & Generate"
                  onPress={() => setRecordingState('stopped')}
                  variant="primary"
                  size="lg"
                />
              )}
            </>
          ) : (
            /* Upload mode */
            <Pressable
              style={{
                width: '100%',
                paddingVertical: 48,
                borderWidth: 2,
                borderColor: colors.primary[200],
                borderStyle: 'dashed',
                borderRadius: 16,
                alignItems: 'center',
                gap: 12,
                backgroundColor: colors.primary[50],
              }}
            >
              <Upload size={40} color={colors.primary[400]} strokeWidth={1.5} />
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.primary[800] }}>
                Tap to select audio file
              </Text>
              <Text style={{ fontSize: 13, color: colors.gray[500] }}>
                MP3, WAV, M4A, AAC, OGG
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
