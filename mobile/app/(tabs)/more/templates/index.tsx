import { View, Text, SafeAreaView, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ClipboardList } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/theme';

const mockTemplates = [
  { id: 1, name: 'General Consultation', type: 'consultation', isDefault: true },
  { id: 2, name: 'Follow-Up Review', type: 'follow_up', isDefault: false },
  { id: 3, name: 'Surgical Report', type: 'procedure', isDefault: false },
];

export default function TemplatesScreen() {
  const router = useRouter();

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
          Templates
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 10 }}>
        <Text style={{ fontSize: 14, color: colors.gray[500], marginBottom: 8 }}>
          Upload sample reports to teach the AI your writing style
        </Text>

        {mockTemplates.map((t) => (
          <Card key={t.id} variant="elevated" padding={14}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: colors.primary[100],
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ClipboardList size={18} color={colors.primary[800]} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.gray[900] }}>
                  {t.name}
                </Text>
                <Text style={{ fontSize: 12, color: colors.gray[500], marginTop: 2 }}>
                  {t.type}
                </Text>
              </View>
              {t.isDefault && <Badge label="Default" variant="info" />}
            </View>
          </Card>
        ))}

        <Button
          title="Upload New Template"
          onPress={() => {}}
          variant="outline"
          size="lg"
          fullWidth
        />
      </ScrollView>
    </SafeAreaView>
  );
}
