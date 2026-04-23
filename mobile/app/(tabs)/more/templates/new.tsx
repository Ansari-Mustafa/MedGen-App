import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { ArrowLeft, FileText, Upload, X } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { colors } from '@/constants/theme';
import {
  createTemplateFromPastReports,
  type OnboardFile,
} from '@/services/api/templates';
import { extractApiError } from '@/utils/errors';

const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

const MIN_FILES = 2;
const MAX_FILES = 5;

export default function NewTemplateScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [files, setFiles] = useState<OnboardFile[]>([]);

  const mutation = useMutation({
    mutationFn: () => createTemplateFromPastReports(name.trim(), files),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['templates'] });
      router.replace(
        `/(tabs)/more/templates/${result.template_id}/onboarding?jobId=${result.job_id}` as never,
      );
    },
    onError: (err) =>
      Alert.alert('Could not start onboarding', extractApiError(err)),
  });

  const pickFiles = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: [DOCX_MIME, '.docx'],
      multiple: true,
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;

    const next = [...files];
    for (const asset of result.assets) {
      if (next.length >= MAX_FILES) break;
      if (!asset.name.toLowerCase().endsWith('.docx')) continue;
      if (next.some((f) => f.uri === asset.uri)) continue;
      next.push({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType ?? DOCX_MIME,
      });
    }
    setFiles(next);
  };

  const removeFile = (uri: string) =>
    setFiles((current) => current.filter((f) => f.uri !== uri));

  const canSubmit =
    name.trim().length > 0 && files.length >= MIN_FILES && !mutation.isPending;

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
          New Template
        </Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text
            style={{
              fontSize: 14,
              color: colors.gray[500],
              lineHeight: 20,
              marginBottom: 20,
            }}
          >
            Upload {MIN_FILES}–{MAX_FILES} past reports you've written. MedGen
            will analyse them and build a reusable template that matches your
            writing style.
          </Text>

          <View style={{ gap: 16 }}>
            <Input
              label="Template name"
              value={name}
              onChangeText={setName}
              placeholder="e.g. Personal Injury Report"
              autoCapitalize="words"
            />

            <Pressable
              onPress={pickFiles}
              disabled={files.length >= MAX_FILES}
              style={{
                paddingVertical: 36,
                paddingHorizontal: 20,
                borderRadius: 16,
                borderWidth: 2,
                borderColor: colors.primary[200],
                borderStyle: 'dashed',
                alignItems: 'center',
                gap: 10,
                backgroundColor: colors.primary[50],
                opacity: files.length >= MAX_FILES ? 0.5 : 1,
              }}
            >
              <Upload size={36} color={colors.primary[400]} strokeWidth={1.5} />
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.primary[800] }}>
                {files.length === 0
                  ? 'Tap to select past reports'
                  : files.length >= MAX_FILES
                    ? 'Maximum files selected'
                    : 'Add more reports'}
              </Text>
              <Text style={{ fontSize: 12, color: colors.gray[500] }}>
                .docx · {MIN_FILES}–{MAX_FILES} files · 10MB each
              </Text>
            </Pressable>

            {files.length > 0 && (
              <View style={{ gap: 8 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: colors.gray[500],
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  {files.length} file{files.length === 1 ? '' : 's'} selected
                </Text>
                {files.map((file) => (
                  <Card key={file.uri} variant="outlined" padding={12}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <FileText size={20} color={colors.primary[800]} strokeWidth={2} />
                      <Text
                        style={{
                          flex: 1,
                          fontSize: 14,
                          color: colors.gray[900],
                        }}
                        numberOfLines={1}
                      >
                        {file.name}
                      </Text>
                      <Pressable onPress={() => removeFile(file.uri)} hitSlop={12}>
                        <X size={18} color={colors.gray[500]} strokeWidth={2} />
                      </Pressable>
                    </View>
                  </Card>
                ))}
              </View>
            )}
          </View>

          <View style={{ marginTop: 28 }}>
            <Button
              title={mutation.isPending ? 'Starting…' : 'Create template'}
              onPress={() => mutation.mutate()}
              variant="primary"
              size="lg"
              fullWidth
              disabled={!canSubmit}
              loading={mutation.isPending}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
