import { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Check,
  Download,
  FileText,
  Pencil,
  X as XIcon,
} from 'lucide-react-native';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { colors } from '@/constants/theme';
import {
  deleteTemplate,
  getTemplate,
  getTemplateDownloadUrl,
  setDefaultTemplate,
  updateTemplate,
  type Template,
} from '@/services/api/templates';
import { extractApiError } from '@/utils/errors';
import { formatDate } from '@/utils/formatting';

export default function TemplateDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  const { data: template, isLoading } = useQuery<Template>({
    queryKey: ['template', id],
    queryFn: () => getTemplate(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (template) setNameDraft(template.name);
  }, [template?.name]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['template', id] });
    qc.invalidateQueries({ queryKey: ['templates'] });
  };

  const renameMutation = useMutation({
    mutationFn: (newName: string) => updateTemplate(id!, { name: newName }),
    onSuccess: () => {
      invalidate();
      setEditingName(false);
    },
    onError: (err) => Alert.alert('Error', extractApiError(err)),
  });

  const activeMutation = useMutation({
    mutationFn: (isActive: boolean) => updateTemplate(id!, { is_active: isActive }),
    onSuccess: invalidate,
    onError: (err) => Alert.alert('Error', extractApiError(err)),
  });

  const defaultMutation = useMutation({
    mutationFn: () => setDefaultTemplate(id!),
    onSuccess: invalidate,
    onError: (err) => Alert.alert('Error', extractApiError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteTemplate(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['templates'] });
      router.back();
    },
    onError: (err) => Alert.alert('Error', extractApiError(err)),
  });

  if (isLoading || !template) return <LoadingSpinner fullScreen />;

  const placeholderEntries = Object.entries(template.placeholders ?? {});
  const isDraft = template.onboarding_status !== 'ready';

  const handleDownload = async () => {
    try {
      const { url } = await getTemplateDownloadUrl(id!);
      await Linking.openURL(url);
    } catch (err) {
      Alert.alert('Download failed', extractApiError(err));
    }
  };

  const confirmDelete = () =>
    Alert.alert(
      'Delete template?',
      `"${template.name}" will be permanently removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(),
        },
      ],
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
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ArrowLeft size={24} color={colors.gray[900]} strokeWidth={2} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: colors.gray[900] }}>
          Template Details
        </Text>
        {!editingName && (
          <Pressable onPress={() => setEditingName(true)} hitSlop={12}>
            <Pencil size={20} color={colors.primary[800]} strokeWidth={2} />
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
        <Card variant="elevated" padding={20}>
          <View style={{ alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: colors.primary[100],
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileText size={32} color={colors.primary[800]} strokeWidth={1.5} />
            </View>
            {editingName ? (
              <View style={{ width: '100%', gap: 10 }}>
                <Input value={nameDraft} onChangeText={setNameDraft} autoFocus />
                <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
                  <Pressable
                    onPress={() => {
                      setNameDraft(template.name);
                      setEditingName(false);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 8,
                      backgroundColor: colors.gray[100],
                    }}
                  >
                    <XIcon size={16} color={colors.gray[700]} strokeWidth={2} />
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.gray[700] }}>
                      Cancel
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      const next = nameDraft.trim();
                      if (!next) {
                        Alert.alert('Name required');
                        return;
                      }
                      if (next === template.name) {
                        setEditingName(false);
                        return;
                      }
                      renameMutation.mutate(next);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 8,
                      backgroundColor: colors.primary[800],
                    }}
                  >
                    <Check size={16} color="#fff" strokeWidth={2} />
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>
                      Save
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: '700',
                  color: colors.gray[900],
                  textAlign: 'center',
                }}
              >
                {template.name}
              </Text>
            )}
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
              {template.is_default && <Badge label="DEFAULT" variant="success" />}
              {template.is_active ? (
                <Badge label="Active" variant="info" />
              ) : (
                <Badge label="Inactive" variant="default" />
              )}
              {isDraft && (
                <Badge
                  label={template.onboarding_status === 'error' ? 'Failed' : 'Processing'}
                  variant={template.onboarding_status === 'error' ? 'error' : 'warning'}
                />
              )}
            </View>
            {template.onboarding_status === 'error' && template.onboarding_error && (
              <Text
                style={{
                  fontSize: 13,
                  color: colors.error.DEFAULT,
                  textAlign: 'center',
                  marginTop: 4,
                }}
              >
                {template.onboarding_error}
              </Text>
            )}
          </View>
        </Card>

        <Text
          style={{
            fontSize: 13,
            fontWeight: '600',
            color: colors.gray[500],
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginTop: 20,
            marginBottom: 8,
          }}
        >
          Status
        </Text>
        <Card variant="elevated" padding={0}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingVertical: 13,
              borderBottomWidth: 1,
              borderBottomColor: colors.gray[100],
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, color: colors.gray[900] }}>Active</Text>
              <Text style={{ fontSize: 12, color: colors.gray[500], marginTop: 2 }}>
                Appears when selecting a template
              </Text>
            </View>
            <Switch
              value={template.is_active}
              onValueChange={(v) => activeMutation.mutate(v)}
              disabled={activeMutation.isPending || isDraft}
              trackColor={{ true: colors.primary[800] }}
            />
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingVertical: 13,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, color: colors.gray[900] }}>Default template</Text>
              <Text style={{ fontSize: 12, color: colors.gray[500], marginTop: 2 }}>
                Pre-selected when recording
              </Text>
            </View>
            <Switch
              value={template.is_default}
              onValueChange={(v) => {
                if (v) defaultMutation.mutate();
              }}
              disabled={
                template.is_default ||
                !template.is_active ||
                defaultMutation.isPending ||
                isDraft
              }
              trackColor={{ true: colors.primary[800] }}
            />
          </View>
        </Card>

        <Text
          style={{
            fontSize: 13,
            fontWeight: '600',
            color: colors.gray[500],
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginTop: 20,
            marginBottom: 8,
          }}
        >
          Placeholders ({placeholderEntries.length})
        </Text>
        {placeholderEntries.length === 0 ? (
          <Card variant="outlined" padding={14}>
            <Text style={{ fontSize: 13, color: colors.gray[500] }}>
              {isDraft
                ? 'Placeholders will appear once the template finishes processing.'
                : 'No placeholders detected in this template.'}
            </Text>
          </Card>
        ) : (
          <Card variant="elevated" padding={0}>
            {placeholderEntries.map(([name, meta], idx) => {
              const info = meta as { type?: string; description?: string };
              return (
                <View
                  key={name}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderBottomWidth: idx < placeholderEntries.length - 1 ? 1 : 0,
                    borderBottomColor: colors.gray[100],
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: colors.gray[900],
                        flex: 1,
                      }}
                    >
                      {name}
                    </Text>
                    {info?.type && (
                      <Badge
                        label={info.type === 'list' ? 'list' : 'text'}
                        variant="default"
                      />
                    )}
                  </View>
                  {info?.description ? (
                    <Text style={{ fontSize: 13, color: colors.gray[500], marginTop: 2 }}>
                      {info.description}
                    </Text>
                  ) : null}
                </View>
              );
            })}
          </Card>
        )}

        <View style={{ marginTop: 20 }}>
          <Text
            style={{
              fontSize: 12,
              color: colors.gray[500],
              textAlign: 'center',
            }}
          >
            Created {formatDate(template.created_at)}
          </Text>
        </View>

        <View style={{ marginTop: 24, gap: 10 }}>
          <Button
            title="Download .docx"
            onPress={handleDownload}
            variant="primary"
            fullWidth
            icon={<Download size={16} color="#fff" strokeWidth={2} />}
            disabled={!template.docx_storage_path}
          />
          {!template.docx_storage_path && (
            <Text
              style={{
                fontSize: 12,
                color: colors.gray[500],
                textAlign: 'center',
                marginTop: -4,
              }}
            >
              Template document is still being generated.
            </Text>
          )}
          <Button
            title={deleteMutation.isPending ? 'Deleting…' : 'Delete Template'}
            onPress={confirmDelete}
            variant="outline"
            fullWidth
            loading={deleteMutation.isPending}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
