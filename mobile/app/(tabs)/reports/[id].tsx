import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Lock, Plus, X } from 'lucide-react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { colors } from '@/constants/theme';
import {
  approveReport,
  getDownloadUrl,
  getReport,
  saveEdits,
} from '@/services/api/reports';
import type { MedicalReport, ReportStatus } from '@/types/models';
import { extractApiError } from '@/utils/errors';
import { formatDate } from '@/utils/formatting';

function statusVariant(status: ReportStatus) {
  switch (status) {
    case 'approved':
      return 'success' as const;
    case 'edited':
    case 'ready':
      return 'info' as const;
    case 'generating':
    case 'pending':
      return 'warning' as const;
    case 'error':
      return 'error' as const;
    default:
      return 'default' as const;
  }
}

function humanize(key: string): string {
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

type FieldValue = string | string[] | null;

function unwrapLegacyFilledJson(
  json: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!json) return {};
  // Legacy shape stored the full Claude response: {filled: {...}, unfilled: [...]}
  // Unwrap so the editor sees the flat placeholder → value map.
  if (
    'filled' in json &&
    typeof json.filled === 'object' &&
    json.filled !== null &&
    !Array.isArray(json.filled)
  ) {
    return json.filled as Record<string, unknown>;
  }
  return json;
}

function normaliseDraft(json: Record<string, unknown>): Record<string, FieldValue> {
  const out: Record<string, FieldValue> = {};
  const source = unwrapLegacyFilledJson(json);
  for (const [k, v] of Object.entries(source)) {
    if (Array.isArray(v)) {
      out[k] = v.map((x) => (typeof x === 'string' ? x : JSON.stringify(x)));
    } else if (v === null || v === undefined) {
      out[k] = '';
    } else if (typeof v === 'string') {
      out[k] = v;
    } else {
      out[k] = JSON.stringify(v);
    }
  }
  return out;
}

function diffDraft(
  original: Record<string, unknown>,
  draft: Record<string, FieldValue>,
): Record<string, FieldValue> {
  const changed: Record<string, FieldValue> = {};
  for (const key of Object.keys(draft)) {
    const before = JSON.stringify(original[key] ?? null);
    const after = JSON.stringify(draft[key] ?? null);
    if (before !== after) changed[key] = draft[key];
  }
  return changed;
}

export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: report, isLoading } = useQuery<MedicalReport>({
    queryKey: ['report', id],
    queryFn: () => getReport(id!),
    enabled: !!id,
  });

  const isApproved = report?.status === 'approved';
  const [draft, setDraft] = useState<Record<string, FieldValue>>({});
  const baselineRef = useRef<Record<string, unknown>>({});

  useEffect(() => {
    if (!report) return;
    baselineRef.current = unwrapLegacyFilledJson(report.filled_json ?? {});
    setDraft(normaliseDraft(report.filled_json ?? {}));
  }, [report?.id, report?.updated_at]);

  const isDirty = useMemo(() => {
    if (!report) return false;
    return JSON.stringify(diffDraft(baselineRef.current, draft)) !== '{}';
  }, [draft, report]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const diff = diffDraft(baselineRef.current, draft);
      return saveEdits(id!, diff);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['report', id] });
      qc.invalidateQueries({ queryKey: ['reports'] });
    },
    onError: (err) => Alert.alert('Could not save', extractApiError(err)),
  });

  const approveMutation = useMutation({
    mutationFn: () => approveReport(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['report', id] });
      qc.invalidateQueries({ queryKey: ['reports'] });
    },
    onError: (err) => Alert.alert('Could not approve', extractApiError(err)),
  });

  const confirmDiscard = useCallback(() => {
    if (!isDirty) {
      router.back();
      return true;
    }
    Alert.alert('Discard changes?', 'Unsaved edits will be lost.', [
      { text: 'Keep editing', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          setDraft(normaliseDraft(baselineRef.current));
          router.back();
        },
      },
    ]);
    return true;
  }, [isDirty, router]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', confirmDiscard);
    return () => sub.remove();
  }, [confirmDiscard]);

  if (isLoading || !report) return <LoadingSpinner fullScreen />;

  const handleDownload = async () => {
    try {
      const { url } = await getDownloadUrl(report.id, 'docx');
      await Linking.openURL(url);
    } catch (err) {
      Alert.alert('Download failed', extractApiError(err));
    }
  };

  const entries = Object.entries(draft);

  const renderStringField = (key: string, value: string) => (
    <View key={key} style={{ gap: 6 }}>
      <Text
        style={{
          fontSize: 12,
          fontWeight: '600',
          color: colors.gray[500],
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {humanize(key)}
      </Text>
      <TextInput
        value={value}
        editable={!isApproved}
        multiline
        onChangeText={(text) => setDraft((d) => ({ ...d, [key]: text }))}
        placeholder="—"
        placeholderTextColor={colors.gray[300]}
        style={{
          borderWidth: 1.5,
          borderColor: isApproved ? colors.gray[100] : colors.gray[200],
          borderRadius: 12,
          backgroundColor: isApproved ? colors.gray[50] : '#FFFFFF',
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 15,
          color: colors.gray[900],
          minHeight: 48,
          textAlignVertical: 'top',
        }}
      />
    </View>
  );

  const renderListField = (key: string, values: string[]) => (
    <View key={key} style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text
          style={{
            fontSize: 12,
            fontWeight: '600',
            color: colors.gray[500],
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          {humanize(key)}
        </Text>
        <Badge label="List" variant="default" />
      </View>
      <View style={{ gap: 8 }}>
        {values.length === 0 && (
          <Text style={{ fontSize: 13, color: colors.gray[500], fontStyle: 'italic' }}>
            No items yet.
          </Text>
        )}
        {values.map((item, idx) => (
          <View
            key={idx}
            style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}
          >
            <Text
              style={{
                marginTop: 14,
                fontSize: 14,
                color: colors.gray[500],
                width: 16,
                textAlign: 'right',
              }}
            >
              •
            </Text>
            <TextInput
              value={item}
              editable={!isApproved}
              multiline
              onChangeText={(text) => {
                setDraft((d) => {
                  const next = [...(d[key] as string[])];
                  next[idx] = text;
                  return { ...d, [key]: next };
                });
              }}
              style={{
                flex: 1,
                borderWidth: 1.5,
                borderColor: isApproved ? colors.gray[100] : colors.gray[200],
                borderRadius: 10,
                backgroundColor: isApproved ? colors.gray[50] : '#FFFFFF',
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 14,
                color: colors.gray[900],
                textAlignVertical: 'top',
              }}
            />
            {!isApproved && (
              <Pressable
                onPress={() => {
                  setDraft((d) => {
                    const next = (d[key] as string[]).filter((_, i) => i !== idx);
                    return { ...d, [key]: next };
                  });
                }}
                style={{ paddingTop: 12 }}
                hitSlop={8}
              >
                <X size={18} color={colors.gray[500]} strokeWidth={2} />
              </Pressable>
            )}
          </View>
        ))}
        {!isApproved && (
          <Pressable
            onPress={() =>
              setDraft((d) => ({
                ...d,
                [key]: [...((d[key] as string[]) ?? []), ''],
              }))
            }
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              alignSelf: 'flex-start',
              paddingVertical: 6,
              paddingHorizontal: 10,
              borderRadius: 8,
              backgroundColor: colors.primary[50],
            }}
          >
            <Plus size={14} color={colors.primary[800]} strokeWidth={2} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.primary[800] }}>
              Add item
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );

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
        <Pressable onPress={confirmDiscard} hitSlop={12}>
          <ArrowLeft size={24} color={colors.gray[900]} strokeWidth={2} />
        </Pressable>
        <Text
          style={{ flex: 1, fontSize: 18, fontWeight: '700', color: colors.gray[900] }}
          numberOfLines={1}
        >
          Report
        </Text>
        <Badge label={report.status} variant={statusVariant(report.status)} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
        >
          <Card variant="elevated" padding={14}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Avatar name={report.patient_name ?? '?'} size={48} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.gray[900] }}>
                  {report.patient_name ?? 'Unknown patient'}
                </Text>
                <Text style={{ fontSize: 13, color: colors.gray[500], marginTop: 2 }}>
                  {formatDate(report.created_at)}
                </Text>
              </View>
            </View>
          </Card>

          {isApproved && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                marginTop: 16,
                padding: 12,
                borderRadius: 12,
                backgroundColor: colors.success.light ?? colors.gray[100],
              }}
            >
              <Lock size={18} color={colors.success.DEFAULT} strokeWidth={2} />
              <Text style={{ flex: 1, fontSize: 13, color: colors.success.DEFAULT }}>
                Approved reports are locked. Fields are read-only.
              </Text>
            </View>
          )}

          <Text
            style={{
              fontSize: 20,
              fontWeight: '700',
              color: colors.gray[900],
              marginTop: 20,
              marginBottom: 12,
            }}
          >
            Report Content
          </Text>

          {entries.length === 0 ? (
            <Card variant="outlined" padding={16}>
              <Text style={{ fontSize: 14, color: colors.gray[500] }}>
                Report is still being generated…
              </Text>
            </Card>
          ) : (
            <View style={{ gap: 16 }}>
              {entries.map(([key, value]) =>
                Array.isArray(value)
                  ? renderListField(key, value)
                  : renderStringField(key, (value ?? '') as string),
              )}
            </View>
          )}

          {!isApproved && report.status !== 'pending' && report.status !== 'generating' && (
            <View style={{ marginTop: 24, gap: 10 }}>
              <Button
                title={approveMutation.isPending ? 'Approving…' : 'Approve report'}
                onPress={() => approveMutation.mutate()}
                variant="secondary"
                fullWidth
                icon={<CheckCircle2 size={16} color={colors.primary[800]} strokeWidth={2} />}
                disabled={isDirty || approveMutation.isPending}
                loading={approveMutation.isPending}
              />
              {isDirty && (
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.gray[500],
                    textAlign: 'center',
                  }}
                >
                  Save your changes before approving.
                </Text>
              )}
            </View>
          )}

          <View style={{ marginTop: 20 }}>
            <Button
              title="Download .docx"
              onPress={handleDownload}
              variant={isApproved ? 'primary' : 'outline'}
              fullWidth
              disabled={!report.docx_path}
            />
            {!report.docx_path && (
              <Text
                style={{
                  fontSize: 12,
                  color: colors.gray[500],
                  textAlign: 'center',
                  marginTop: 6,
                }}
              >
                Document is still being generated.
              </Text>
            )}
          </View>
        </ScrollView>

        {isDirty && !isApproved && (
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              flexDirection: 'row',
              gap: 10,
              padding: 16,
              backgroundColor: '#FFFFFF',
              borderTopWidth: 1,
              borderTopColor: colors.gray[100],
            }}
          >
            <View style={{ flex: 1 }}>
              <Button
                title="Cancel"
                onPress={() => setDraft(normaliseDraft(baselineRef.current))}
                variant="outline"
                fullWidth
                disabled={saveMutation.isPending}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                title={saveMutation.isPending ? 'Saving…' : 'Save changes'}
                onPress={() => saveMutation.mutate()}
                variant="primary"
                fullWidth
                loading={saveMutation.isPending}
                disabled={saveMutation.isPending}
              />
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
