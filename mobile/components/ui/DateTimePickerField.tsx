import { useState } from 'react';
import { Platform, View, Text, Pressable, Modal, SafeAreaView } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Calendar, Clock } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';

type PickerMode = 'date' | 'time';

interface DateTimePickerFieldProps {
  label?: string;
  mode?: PickerMode;
  value?: Date | null;
  onChange: (d: Date) => void;
  placeholder?: string;
  error?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  disabled?: boolean;
}

const pad = (n: number) => n.toString().padStart(2, '0');

function formatValue(d: Date, mode: PickerMode): string {
  if (mode === 'time') return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function DateTimePickerField({
  label,
  mode = 'date',
  value,
  onChange,
  placeholder,
  error,
  minimumDate,
  maximumDate,
  disabled,
}: DateTimePickerFieldProps) {
  const [show, setShow] = useState(false);
  const [tempValue, setTempValue] = useState<Date>(value ?? new Date());
  const Icon = mode === 'time' ? Clock : Calendar;

  const openPicker = () => {
    if (disabled) return;
    setTempValue(value ?? new Date());
    setShow(true);
  };

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
      if (event.type === 'set' && selected) onChange(selected);
      return;
    }
    if (selected) setTempValue(selected);
  };

  const confirmIOS = () => {
    onChange(tempValue);
    setShow(false);
  };

  const defaultPlaceholder = mode === 'time' ? 'Select time' : 'Select date';

  return (
    <View style={{ gap: 6 }}>
      {label && (
        <Text style={{ fontSize: 14, fontWeight: '500', color: colors.gray[700] }}>{label}</Text>
      )}
      <Pressable onPress={openPicker} disabled={disabled} style={{ opacity: disabled ? 0.6 : 1 }}>
        <Card variant="outlined" padding={14}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Icon size={16} color={colors.gray[500]} strokeWidth={2} />
            <Text
              style={{
                flex: 1,
                fontSize: 15,
                color: value ? colors.gray[900] : colors.gray[500],
              }}
            >
              {value ? formatValue(value, mode) : placeholder ?? defaultPlaceholder}
            </Text>
          </View>
        </Card>
      </Pressable>
      {error && (
        <Text style={{ fontSize: 12, color: colors.error.DEFAULT }}>{error}</Text>
      )}

      {Platform.OS === 'android' && show && (
        <DateTimePicker
          value={value ?? new Date()}
          mode={mode}
          is24Hour
          onChange={handleChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal visible={show} transparent animationType="slide" onRequestClose={() => setShow(false)}>
          <Pressable
            onPress={() => setShow(false)}
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
          >
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={{ width: '100%', backgroundColor: '#fff' }}
            >
              <SafeAreaView style={{ width: '100%', backgroundColor: '#fff' }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.gray[100],
                  }}
                >
                  <Pressable onPress={() => setShow(false)} hitSlop={12}>
                    <Text style={{ fontSize: 15, color: colors.gray[500] }}>Cancel</Text>
                  </Pressable>
                  <Pressable onPress={confirmIOS} hitSlop={12}>
                    <Text style={{ fontSize: 15, color: colors.primary[600], fontWeight: '600' }}>
                      Done
                    </Text>
                  </Pressable>
                </View>
                <View style={{ alignItems: 'center', width: '100%' }}>
                  <DateTimePicker
                    value={tempValue}
                    mode={mode}
                    is24Hour
                    display="spinner"
                    onChange={handleChange}
                    minimumDate={minimumDate}
                    maximumDate={maximumDate}
                    themeVariant="light"
                    style={{ width: '100%' }}
                  />
                </View>
              </SafeAreaView>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}
