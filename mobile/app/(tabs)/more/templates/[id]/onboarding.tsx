import { useCallback, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Pressable,
  SafeAreaView,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/theme';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';
import { getOnboardingJob } from '@/services/api/templates';
import type { OnboardingStep } from '@/types/models';

const STEP_ORDER: OnboardingStep[] = [
  'upload',
  'extract',
  'architect',
  'transform',
  'finalize',
];

const STEP_LABELS: Record<OnboardingStep, string> = {
  upload: 'Uploading past reports',
  extract: 'Reading your reports',
  architect: 'Learning your structure',
  transform: 'Building template',
  finalize: 'Saving template',
  done: 'Done',
  error: 'Error',
  connected: 'Connecting',
};

function stepIndex(step: OnboardingStep | undefined): number {
  if (!step) return -1;
  const idx = STEP_ORDER.indexOf(step);
  return idx;
}

export default function TemplateOnboardingScreen() {
  const { id, jobId } = useLocalSearchParams<{ id: string; jobId: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const donePendingRef = useRef(false);

  const wsStatus = useOnboardingStatus(jobId ?? null);

  // Polling fallback in case the WS event is missed (e.g. user opened screen late).
  const { data: jobSnapshot } = useQuery({
    queryKey: ['onboarding-job', jobId],
    queryFn: () => getOnboardingJob(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const latest = query.state.data;
      if (!latest) return 2000;
      return latest.status === 'done' || latest.status === 'error' ? false : 2000;
    },
  });

  const step: OnboardingStep =
    wsStatus?.step ?? (jobSnapshot?.step as OnboardingStep | undefined) ?? 'upload';
  const pollStatus = jobSnapshot?.status;
  const isDone = step === 'done' || pollStatus === 'done';
  const isError = step === 'error' || pollStatus === 'error';
  const message =
    wsStatus?.message ??
    (isError
      ? jobSnapshot?.error ?? 'Something went wrong'
      : STEP_LABELS[step] ?? 'Processing…');
  const activeIdx = stepIndex(step);
  const progressPct =
    wsStatus?.progress ??
    (isDone
      ? 100
      : activeIdx >= 0
        ? Math.round(((activeIdx + 1) / STEP_ORDER.length) * 100)
        : 10);

  // On success: invalidate caches and redirect to template detail.
  useEffect(() => {
    if (!isDone || donePendingRef.current) return;
    donePendingRef.current = true;
    qc.invalidateQueries({ queryKey: ['templates'] });
    qc.invalidateQueries({ queryKey: ['template', id] });
    const t = setTimeout(() => {
      router.replace(`/(tabs)/more/templates/${id}` as never);
    }, 1500);
    return () => clearTimeout(t);
  }, [isDone, id, qc, router]);

  // Guard back-swipe while running.
  const guardExit = useCallback(() => {
    if (isDone || isError) {
      router.replace(`/(tabs)/more/templates/${id}` as never);
      return true;
    }
    Alert.alert(
      'Leave onboarding?',
      'The template will keep processing in the background. You can come back later.',
      [
        { text: 'Stay', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => router.replace('/(tabs)/more/templates' as never),
        },
      ],
    );
    return true;
  }, [isDone, isError, router, id]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', guardExit);
    return () => sub.remove();
  }, [guardExit]);

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
        <Pressable onPress={guardExit} hitSlop={12}>
          <ArrowLeft size={24} color={colors.gray[900]} strokeWidth={2} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: colors.gray[900] }}>
          Building template
        </Text>
      </View>

      <View
        style={{
          flex: 1,
          paddingHorizontal: 24,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
        }}
      >
        {isError ? (
          <AlertCircle size={56} color={colors.error.DEFAULT} strokeWidth={1.5} />
        ) : isDone ? (
          <CheckCircle size={56} color={colors.success.DEFAULT} strokeWidth={1.5} />
        ) : (
          <ActivityIndicator size="large" color={colors.primary[800]} />
        )}

        <View style={{ alignItems: 'center', gap: 6 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '700',
              color: colors.gray[900],
              textAlign: 'center',
            }}
          >
            {isDone
              ? 'Template ready!'
              : isError
                ? 'Onboarding failed'
                : STEP_LABELS[step]}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.gray[500],
              textAlign: 'center',
              lineHeight: 20,
            }}
          >
            {message}
          </Text>
        </View>

        {!isDone && !isError && (
          <View style={{ width: '100%', gap: 12 }}>
            <View
              style={{
                width: '100%',
                height: 6,
                backgroundColor: colors.gray[100],
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  height: '100%',
                  width: `${Math.min(100, Math.max(0, progressPct))}%`,
                  backgroundColor: colors.primary[800],
                  borderRadius: 3,
                }}
              />
            </View>
            <View style={{ gap: 6 }}>
              {STEP_ORDER.map((s, idx) => {
                const done = activeIdx > idx || isDone;
                const current = activeIdx === idx && !isDone;
                return (
                  <View
                    key={s}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
                  >
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: done
                          ? colors.success.DEFAULT
                          : current
                            ? colors.primary[800]
                            : colors.gray[200],
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 13,
                        color: current ? colors.gray[900] : colors.gray[500],
                        fontWeight: current ? '600' : '400',
                      }}
                    >
                      {STEP_LABELS[s]}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {isError && (
          <View style={{ width: '100%', gap: 10 }}>
            <Button
              title="Back to templates"
              onPress={() => router.replace('/(tabs)/more/templates' as never)}
              variant="outline"
              fullWidth
            />
          </View>
        )}

        {isDone && (
          <Button
            title="View template"
            onPress={() =>
              router.replace(`/(tabs)/more/templates/${id}` as never)
            }
            variant="primary"
            size="lg"
            fullWidth
          />
        )}
      </View>
    </SafeAreaView>
  );
}
