import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { Pause, Play, RotateCcw, RotateCw } from 'lucide-react-native';

import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';
import { formatDuration } from '@/utils/formatting';

const SKIP_MS = 15_000;

interface AudioPlayerProps {
  getUrl: () => Promise<string>;
  title?: string;
}

export function AudioPlayer({ getUrl, title }: AudioPlayerProps) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = await getUrl();
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

      if (soundRef.current) {
        await soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }

      const { sound, status } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: false, progressUpdateIntervalMillis: 500 },
      );
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((s: AVPlaybackStatus) => {
        if (!s.isLoaded) return;
        setIsPlaying(s.isPlaying);
        setPositionMs(s.positionMillis);
        setDurationMs(s.durationMillis ?? 0);
        if (s.didJustFinish) {
          sound.setPositionAsync(0).catch(() => {});
          setIsPlaying(false);
        }
      });
      if (status.isLoaded) {
        setPositionMs(status.positionMillis);
        setDurationMs(status.durationMillis ?? 0);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load audio');
    } finally {
      setLoading(false);
    }
  }, [getUrl]);

  useEffect(() => {
    load();
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
      soundRef.current = null;
    };
  }, [load]);

  // Pause when the screen loses focus.
  useFocusEffect(
    useCallback(() => {
      return () => {
        soundRef.current?.pauseAsync().catch(() => {});
      };
    }, []),
  );

  const toggle = useCallback(async () => {
    const sound = soundRef.current;
    if (!sound) {
      load();
      return;
    }
    try {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } catch (e) {
      // URL may have expired. Try reloading once.
      await load();
    }
  }, [isPlaying, load]);

  const seekBy = useCallback(
    async (deltaMs: number) => {
      const sound = soundRef.current;
      if (!sound) return;
      const next = Math.max(0, Math.min(durationMs, positionMs + deltaMs));
      try {
        await sound.setPositionAsync(next);
      } catch {
        /* ignored */
      }
    },
    [durationMs, positionMs],
  );

  const pct =
    durationMs > 0 ? Math.min(100, Math.max(0, (positionMs / durationMs) * 100)) : 0;

  return (
    <Card variant="elevated" padding={16}>
      {title ? (
        <Text
          style={{
            fontSize: 13,
            fontWeight: '600',
            color: colors.gray[500],
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 10,
          }}
        >
          {title}
        </Text>
      ) : null}
      {loading ? (
        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
          <ActivityIndicator color={colors.primary[800]} />
        </View>
      ) : error ? (
        <View style={{ paddingVertical: 12, gap: 8, alignItems: 'center' }}>
          <Text style={{ fontSize: 13, color: colors.error.DEFAULT, textAlign: 'center' }}>
            {error}
          </Text>
          <Pressable
            onPress={load}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 8,
              backgroundColor: colors.gray[100],
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.gray[900] }}>
              Retry
            </Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View
            style={{
              height: 6,
              borderRadius: 3,
              backgroundColor: colors.gray[100],
              overflow: 'hidden',
              marginBottom: 8,
            }}
          >
            <View
              style={{
                width: `${pct}%`,
                height: '100%',
                backgroundColor: colors.primary[800],
              }}
            />
          </View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 12, color: colors.gray[500], fontVariant: ['tabular-nums'] }}>
              {formatDuration(Math.floor(positionMs / 1000))}
            </Text>
            <Text style={{ fontSize: 12, color: colors.gray[500], fontVariant: ['tabular-nums'] }}>
              {formatDuration(Math.floor(durationMs / 1000))}
            </Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 22,
            }}
          >
            <Pressable onPress={() => seekBy(-SKIP_MS)} hitSlop={8}>
              <RotateCcw size={26} color={colors.gray[700]} strokeWidth={2} />
            </Pressable>
            <Pressable
              onPress={toggle}
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: colors.primary[800],
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isPlaying ? (
                <Pause size={28} color="#fff" fill="#fff" strokeWidth={0} />
              ) : (
                <Play size={28} color="#fff" fill="#fff" strokeWidth={0} />
              )}
            </Pressable>
            <Pressable onPress={() => seekBy(SKIP_MS)} hitSlop={8}>
              <RotateCw size={26} color={colors.gray[700]} strokeWidth={2} />
            </Pressable>
          </View>
        </>
      )}
    </Card>
  );
}
