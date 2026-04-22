import { View, Text, SafeAreaView, Modal, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { colors } from '@/constants/theme';

interface PickerModalProps<T extends { id: string }> {
  visible: boolean;
  title: string;
  items: T[];
  loading?: boolean;
  labelKey: keyof T;
  subLabelKey?: keyof T;
  onSelect: (item: T) => void;
  onClose: () => void;
}

export function PickerModal<T extends { id: string }>({
  visible,
  title,
  items,
  loading,
  labelKey,
  subLabelKey,
  onSelect,
  onClose,
}: PickerModalProps<T>) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.gray[100],
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.gray[900] }}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={{ fontSize: 15, color: colors.primary[600], fontWeight: '600' }}>Cancel</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={colors.primary[600]} />
          </View>
        ) : items.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
            <Text style={{ fontSize: 15, color: colors.gray[500], textAlign: 'center' }}>
              No items available.
            </Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.gray[200],
                  backgroundColor: '#fff',
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.gray[900] }}>
                  {String(item[labelKey] ?? '')}
                </Text>
                {subLabelKey && item[subLabelKey] ? (
                  <Text style={{ fontSize: 13, color: colors.gray[500], marginTop: 2 }}>
                    {String(item[subLabelKey])}
                  </Text>
                ) : null}
              </Pressable>
            )}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}
