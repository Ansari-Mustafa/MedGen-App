import { useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ChevronRight,
  FileText,
  Plus,
  Sparkles,
} from 'lucide-react-native';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { SearchBar } from '@/components/ui/SearchBar';
import { colors } from '@/constants/theme';
import {
  deleteTemplate,
  getTemplates,
  setDefaultTemplate,
  updateTemplate,
  type Template,
} from '@/services/api/templates';
import { extractApiError } from '@/utils/errors';

function placeholderCount(template: Template): number {
  if (!template.placeholders) return 0;
  return Object.keys(template.placeholders).length;
}

export default function TemplatesListScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

  const {
    data: templates = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<Template[]>({
    queryKey: ['templates'],
    queryFn: getTemplates,
  });

  const setDefaultMutation = useMutation({
    mutationFn: setDefaultTemplate,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
    onError: (err) => Alert.alert('Error', extractApiError(err)),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateTemplate(id, { is_active: isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
    onError: (err) => Alert.alert('Error', extractApiError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
    onError: (err) => Alert.alert('Error', extractApiError(err)),
  });

  const filtered = templates.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleLongPress = (template: Template) => {
    const options: { text: string; onPress?: () => void; style?: 'destructive' | 'cancel' }[] = [];

    if (!template.is_default && template.is_active) {
      options.push({
        text: 'Set as default',
        onPress: () => setDefaultMutation.mutate(template.id),
      });
    }
    options.push({
      text: template.is_active ? 'Deactivate' : 'Activate',
      onPress: () =>
        toggleActiveMutation.mutate({ id: template.id, isActive: !template.is_active }),
    });
    options.push({
      text: 'Delete',
      style: 'destructive',
      onPress: () =>
        Alert.alert(
          'Delete template?',
          `"${template.name}" will be permanently removed.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => deleteMutation.mutate(template.id),
            },
          ],
        ),
    });
    options.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert(template.name, undefined, options);
  };

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
            Templates
          </Text>
          <Pressable
            onPress={() => router.push('/(tabs)/more/templates/new' as never)}
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
        {templates.length > 0 && (
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Search templates..."
          />
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 10 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        renderItem={({ item }) => {
          const count = placeholderCount(item);
          const isDraft = item.onboarding_status !== 'ready';
          return (
            <Card variant="elevated" padding={14}>
              <Pressable
                onPress={() =>
                  router.push(`/(tabs)/more/templates/${item.id}` as never)
                }
                onLongPress={() => handleLongPress(item)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
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
                  <FileText size={20} color={colors.primary[800]} strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: '600',
                        color: colors.gray[900],
                        flexShrink: 1,
                      }}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    {item.is_default && <Badge label="DEFAULT" variant="success" />}
                    {!item.is_active && !isDraft && (
                      <Badge label="Inactive" variant="default" />
                    )}
                    {isDraft && (
                      <Badge
                        label={item.onboarding_status === 'error' ? 'Failed' : 'Processing'}
                        variant={item.onboarding_status === 'error' ? 'error' : 'info'}
                      />
                    )}
                  </View>
                  <Text style={{ fontSize: 13, color: colors.gray[500], marginTop: 2 }}>
                    {count} placeholder{count === 1 ? '' : 's'}
                  </Text>
                </View>
                <ChevronRight size={18} color={colors.gray[300]} strokeWidth={2} />
              </Pressable>
            </Card>
          );
        }}
        ListEmptyComponent={
          <View
            style={{
              alignItems: 'center',
              paddingTop: 60,
              paddingHorizontal: 24,
              gap: 14,
            }}
          >
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
              <Sparkles size={32} color={colors.primary[800]} strokeWidth={1.5} />
            </View>
            <Text
              style={{ fontSize: 16, fontWeight: '600', color: colors.gray[700] }}
            >
              No templates yet
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.gray[500],
                textAlign: 'center',
                lineHeight: 20,
              }}
            >
              Upload a few past reports and MedGen will build a reusable template
              in your writing style.
            </Text>
            <View style={{ marginTop: 8 }}>
              <Button
                title="Upload past reports"
                onPress={() => router.push('/(tabs)/more/templates/new' as never)}
                variant="primary"
                size="md"
              />
            </View>
          </View>
        }
      />
    </SafeAreaView>
  );
}
