import { useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ChevronRight, FileText } from 'lucide-react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PickerModal } from '@/components/ui/PickerModal';
import { APP_VERSION } from '@/constants/config';
import { colors } from '@/constants/theme';
import {
  getTemplates,
  setDefaultTemplate,
  type Template,
} from '@/services/api/templates';
import { useUIStore } from '@/stores/uiStore';
import { extractApiError } from '@/utils/errors';

export default function SettingsScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { theme, setTheme } = useUIStore();
  const [showPicker, setShowPicker] = useState(false);

  const { data: templates = [], isLoading: loadingTemplates } = useQuery<Template[]>({
    queryKey: ['templates'],
    queryFn: getTemplates,
  });

  const defaultTemplate = templates.find((t) => t.is_default) ?? null;
  const activeTemplates = templates.filter((t) => t.is_active && t.onboarding_status === 'ready');

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => setDefaultTemplate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
    onError: (err) => Alert.alert('Error', extractApiError(err)),
  });

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
          Settings
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
        <Text
          style={{
            fontSize: 13,
            fontWeight: '600',
            color: colors.gray[500],
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 8,
          }}
        >
          Appearance
        </Text>
        <Card variant="elevated" padding={0}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingVertical: 13,
            }}
          >
            <Text style={{ fontSize: 15, color: colors.gray[900] }}>Dark Mode</Text>
            <Switch
              value={theme === 'dark'}
              onValueChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
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
          Default Template
        </Text>
        {templates.length === 0 && !loadingTemplates ? (
          <Card variant="outlined" padding={14}>
            <Text style={{ fontSize: 14, color: colors.gray[700], marginBottom: 10 }}>
              You haven't built a template yet. MedGen will auto-select your default
              template each time you record.
            </Text>
            <Button
              title="Create your first template"
              onPress={() => router.push('/(tabs)/more/templates/new' as never)}
              variant="primary"
              size="md"
              fullWidth
            />
          </Card>
        ) : (
          <Card variant="elevated" padding={0}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingHorizontal: 16,
                paddingVertical: 13,
                borderBottomWidth: 1,
                borderBottomColor: colors.gray[100],
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: colors.primary[100],
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileText size={18} color={colors.primary[800]} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, color: colors.gray[500] }}>Current default</Text>
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.gray[900] }}>
                  {defaultTemplate?.name ?? 'None selected'}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => setShowPicker(true)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 13,
              }}
            >
              <Text style={{ fontSize: 15, color: colors.primary[800], fontWeight: '600' }}>
                Change default
              </Text>
              <ChevronRight size={18} color={colors.gray[300]} strokeWidth={2} />
            </Pressable>
          </Card>
        )}

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
          More
        </Text>
        <Card variant="outlined" padding={16}>
          <Text style={{ fontSize: 14, color: colors.gray[500] }}>
            Push notifications, biometric lock, and audio quality controls are coming soon.
          </Text>
        </Card>

        <Text style={{ fontSize: 12, color: colors.gray[500], textAlign: 'center', marginTop: 16 }}>
          MedGen v{APP_VERSION}
        </Text>
      </ScrollView>

      <PickerModal<Template>
        visible={showPicker}
        title="Default Template"
        items={activeTemplates}
        loading={loadingTemplates}
        labelKey="name"
        onSelect={(item) => setDefaultMutation.mutate(item.id)}
        onClose={() => setShowPicker(false)}
      />
    </SafeAreaView>
  );
}
