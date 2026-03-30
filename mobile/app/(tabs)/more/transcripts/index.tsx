import { View, Text, SafeAreaView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ScrollText } from 'lucide-react-native';
import { colors } from '@/constants/theme';

export default function TranscriptsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.gray[50] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, gap: 12 }}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ArrowLeft size={24} color={colors.gray[900]} strokeWidth={2} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: colors.gray[900] }}>Transcripts</Text>
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: colors.gray[100],
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ScrollText size={32} color={colors.gray[500]} strokeWidth={1.5} />
        </View>
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.gray[700] }}>No transcripts yet</Text>
        <Text style={{ fontSize: 14, color: colors.gray[500] }}>Record a session to create transcripts</Text>
      </View>
    </SafeAreaView>
  );
}
