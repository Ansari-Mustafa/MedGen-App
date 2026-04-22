import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  Pressable,
  ScrollView,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { Mic, Upload, User, ChevronRight, Square, CheckCircle, AlertCircle, FileText } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';
import { formatDuration, formatDateTime } from '@/utils/formatting';
import { useRecording } from '@/hooks/useRecording';
import { usePipelineStatus } from '@/hooks/usePipelineStatus';
import { getAppointments } from '@/services/api/appointments';
import { getTemplates, Template } from '@/services/api/templates';
import type { Appointment } from '@/types/models';

// ─── Picker Modal ─────────────────────────────────────────────────────────────

function PickerModal<T extends { id: string }>({
  visible,
  title,
  items,
  loading,
  labelKey,
  subLabelKey,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  items: T[];
  loading: boolean;
  labelKey: keyof T;
  subLabelKey?: keyof T;
  onSelect: (item: T) => void;
  onClose: () => void;
}) {
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

// ─── Pipeline Progress Overlay ────────────────────────────────────────────────

function PipelineOverlay({
  visible,
  reportId,
  onDone,
}: {
  visible: boolean;
  reportId: string | null;
  onDone: (reportId: string) => void;
}) {
  const status = usePipelineStatus(reportId);
  const router = useRouter();

  useEffect(() => {
    if (status?.step === 'done' && reportId) {
      const timer = setTimeout(() => onDone(reportId), 1200);
      return () => clearTimeout(timer);
    }
  }, [status?.step, reportId, onDone]);

  if (!visible) return null;

  const isDone = status?.step === 'done';
  const isError = status?.step === 'error';

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.55)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
        }}
      >
        <View
          style={{
            backgroundColor: '#fff',
            borderRadius: 20,
            padding: 32,
            width: '100%',
            alignItems: 'center',
            gap: 20,
          }}
        >
          {isError ? (
            <AlertCircle size={48} color={colors.error.DEFAULT} strokeWidth={1.5} />
          ) : isDone ? (
            <CheckCircle size={48} color={colors.success.DEFAULT} strokeWidth={1.5} />
          ) : (
            <ActivityIndicator size="large" color={colors.primary[600]} />
          )}

          <View style={{ alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.gray[900] }}>
              {isDone ? 'Report Ready!' : isError ? 'Generation Failed' : 'Generating Report'}
            </Text>
            <Text style={{ fontSize: 14, color: colors.gray[500], textAlign: 'center' }}>
              {status?.message ?? 'Processing your recording…'}
            </Text>
          </View>

          {/* Progress bar */}
          {!isDone && !isError && (
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
                  width: `${status?.progress ?? 0}%`,
                  backgroundColor: colors.primary[600],
                  borderRadius: 3,
                }}
              />
            </View>
          )}

          {isError && (
            <Button
              title="Dismiss"
              onPress={() => onDone(reportId ?? '')}
              variant="outline"
              size="md"
            />
          )}

          {isDone && (
            <Button
              title="View Report"
              onPress={() => {
                onDone(reportId ?? '');
                router.push('/(tabs)/reports');
              }}
              variant="primary"
              size="md"
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function RecordScreen() {
  const params = useLocalSearchParams<{ appointmentId?: string }>();
  const [selectedMode, setSelectedMode] = useState<'record' | 'upload'>('record');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showAppointmentPicker, setShowAppointmentPicker] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);
  const [showPipeline, setShowPipeline] = useState(false);

  const { data: appointments = [], isLoading: loadingAppts } = useQuery<Appointment[]>({
    queryKey: ['appointments'],
    queryFn: getAppointments,
  });

  const appointmentOptions = appointments.map((a) => ({
    ...a,
    display_name: a.patient_name ?? 'Unknown patient',
    display_when: formatDateTime(a.scheduled_at),
  }));

  // Preselect appointment if ?appointmentId= was passed in
  useEffect(() => {
    if (params.appointmentId && !selectedAppointment && appointments.length > 0) {
      const match = appointments.find((a) => a.id === params.appointmentId);
      if (match) setSelectedAppointment(match);
    }
  }, [params.appointmentId, appointments, selectedAppointment]);

  const { data: templates = [], isLoading: loadingTemplates } = useQuery({
    queryKey: ['templates'],
    queryFn: getTemplates,
  });

  const {
    state,
    duration,
    error: recordingError,
    uploadResult,
    start,
    pause,
    resume,
    finishAndUpload,
    uploadFile,
    reset,
  } = useRecording({
    appointmentId: selectedAppointment?.id,
    templateId: selectedTemplate?.id,
  });

  // When upload succeeds, show the pipeline overlay
  useEffect(() => {
    if (uploadResult) {
      setReportId(uploadResult.report_id);
      setShowPipeline(true);
    }
  }, [uploadResult]);

  const handlePipelineDone = useCallback(() => {
    setShowPipeline(false);
    setReportId(null);
    reset();
  }, [reset]);

  const handlePickFile = async () => {
    if (!selectedAppointment || !selectedTemplate) {
      Alert.alert('Select first', 'Choose an appointment and template before uploading.');
      return;
    }
    const result = await DocumentPicker.getDocumentAsync({
      type: ['audio/*'],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets[0]) {
      await uploadFile(result.assets[0].uri);
    }
  };

  const canProceed = !!selectedAppointment && !!selectedTemplate;
  const isUploading = state === 'uploading';
  const isRecording = state === 'recording';
  const isPaused = state === 'paused';
  const isActive = isRecording || isPaused;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.gray[50] }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={{ paddingTop: 16, paddingBottom: 24 }}>
          <Text style={{ fontSize: 26, fontWeight: '800', color: colors.gray[900], letterSpacing: -0.5 }}>
            Record Session
          </Text>
          <Text style={{ fontSize: 15, color: colors.gray[500], marginTop: 4 }}>
            Record or upload a consultation
          </Text>
        </View>

        {/* Mode Toggle */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: colors.gray[100],
            borderRadius: 12,
            padding: 4,
            marginBottom: 16,
          }}
        >
          {([
            { key: 'record' as const, label: 'Record', Icon: Mic },
            { key: 'upload' as const, label: 'Upload File', Icon: Upload },
          ] as const).map(({ key, label, Icon }) => (
            <Pressable
              key={key}
              onPress={() => {
                setSelectedMode(key);
                if (isActive) reset();
              }}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                paddingVertical: 10,
                borderRadius: 10,
                backgroundColor: selectedMode === key ? '#FFFFFF' : 'transparent',
                ...(selectedMode === key
                  ? { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 }
                  : {}),
              }}
            >
              <Icon size={16} color={selectedMode === key ? colors.gray[900] : colors.gray[500]} strokeWidth={2} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: selectedMode === key ? colors.gray[900] : colors.gray[500] }}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Appointment Picker */}
        <Card variant="outlined" padding={14} style={{ marginBottom: 10 }}>
          <Pressable
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
            onPress={() => setShowAppointmentPicker(true)}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.primary[100],
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <User size={20} color={colors.primary[800]} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.gray[900] }}>
                {selectedAppointment?.patient_name ?? 'Select Appointment'}
              </Text>
              <Text style={{ fontSize: 13, color: colors.gray[500] }}>
                {selectedAppointment
                  ? formatDateTime(selectedAppointment.scheduled_at)
                  : 'Choose the patient appointment'}
              </Text>
            </View>
            <ChevronRight size={20} color={colors.gray[300]} strokeWidth={2} />
          </Pressable>
        </Card>

        {/* Template Picker */}
        <Card variant="outlined" padding={14} style={{ marginBottom: 24 }}>
          <Pressable
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
            onPress={() => setShowTemplatePicker(true)}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.primary[100],
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileText size={20} color={colors.primary[800]} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.gray[900] }}>
                {selectedTemplate?.name ?? 'Select Template'}
              </Text>
              <Text style={{ fontSize: 13, color: colors.gray[500] }}>
                {selectedTemplate ? 'Report template selected' : 'Choose the report template'}
              </Text>
            </View>
            <ChevronRight size={20} color={colors.gray[300]} strokeWidth={2} />
          </Pressable>
        </Card>

        {/* Recording / Upload area */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, paddingBottom: 40 }}>
          {selectedMode === 'record' ? (
            <>
              {/* Waveform / status */}
              <View
                style={{
                  width: '100%',
                  height: 80,
                  backgroundColor: isRecording ? colors.error.light ?? '#FEF2F2' : colors.primary[50],
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    color: isRecording ? colors.error.DEFAULT : colors.primary[400],
                    fontSize: 13,
                    letterSpacing: isRecording ? 3 : 1,
                  }}
                >
                  {isRecording
                    ? '▁▃▅▇▅▃▁▃▅▇▅▃▁▃▅▇'
                    : isPaused
                    ? 'Paused — tap to resume'
                    : 'Tap the mic to start recording'}
                </Text>
              </View>

              {/* Timer */}
              <Text
                style={{
                  fontSize: 48,
                  fontWeight: '300',
                  color: colors.gray[900],
                  fontVariant: ['tabular-nums'],
                }}
              >
                {formatDuration(duration)}
              </Text>

              {/* Record / Pause button */}
              <Pressable
                onPress={() => {
                  if (!canProceed && state === 'idle') {
                    Alert.alert('Select first', 'Choose an appointment and template before recording.');
                    return;
                  }
                  if (state === 'idle') start();
                  else if (isRecording) pause();
                  else if (isPaused) resume();
                }}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: isRecording ? colors.error.DEFAULT : colors.primary[800],
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: isRecording ? colors.error.DEFAULT : colors.primary[800],
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                  opacity: isUploading ? 0.4 : 1,
                }}
                disabled={isUploading}
              >
                {isRecording ? (
                  <Square size={24} color="#FFFFFF" fill="#FFFFFF" strokeWidth={0} />
                ) : (
                  <Mic size={32} color="#FFFFFF" strokeWidth={2} />
                )}
              </Pressable>

              {isActive && (
                <Button
                  title={isUploading ? 'Uploading…' : 'Finish & Generate Report'}
                  onPress={finishAndUpload}
                  variant="primary"
                  size="lg"
                  loading={isUploading}
                  disabled={isUploading}
                />
              )}
            </>
          ) : (
            /* Upload mode */
            <Pressable
              onPress={handlePickFile}
              disabled={isUploading}
              style={{
                width: '100%',
                paddingVertical: 48,
                borderWidth: 2,
                borderColor: colors.primary[200],
                borderStyle: 'dashed',
                borderRadius: 16,
                alignItems: 'center',
                gap: 12,
                backgroundColor: colors.primary[50],
                opacity: isUploading ? 0.5 : 1,
              }}
            >
              {isUploading ? (
                <>
                  <ActivityIndicator color={colors.primary[600]} />
                  <Text style={{ fontSize: 15, fontWeight: '600', color: colors.primary[800] }}>
                    Uploading…
                  </Text>
                </>
              ) : (
                <>
                  <Upload size={40} color={colors.primary[400]} strokeWidth={1.5} />
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.primary[800] }}>
                    Tap to select audio file
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.gray[500] }}>
                    MP3, WAV, M4A, AAC, OGG
                  </Text>
                </>
              )}
            </Pressable>
          )}

          {/* Error display */}
          {recordingError && (
            <Text style={{ color: colors.error.DEFAULT, fontSize: 14, textAlign: 'center' }}>
              {recordingError}
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Appointment picker modal */}
      <PickerModal
        visible={showAppointmentPicker}
        title="Select Appointment"
        items={appointmentOptions}
        loading={loadingAppts}
        labelKey="display_name"
        subLabelKey="display_when"
        onSelect={(item) => setSelectedAppointment(item as unknown as Appointment)}
        onClose={() => setShowAppointmentPicker(false)}
      />

      {/* Template picker modal */}
      <PickerModal<Template>
        visible={showTemplatePicker}
        title="Select Template"
        items={templates}
        loading={loadingTemplates}
        labelKey="name"
        onSelect={setSelectedTemplate}
        onClose={() => setShowTemplatePicker(false)}
      />

      {/* Pipeline progress overlay */}
      <PipelineOverlay
        visible={showPipeline}
        reportId={reportId}
        onDone={handlePipelineDone}
      />
    </SafeAreaView>
  );
}
