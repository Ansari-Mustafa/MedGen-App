// ── User / Profile ───────────────────────────────────────────

export interface User {
  id: string;
  email: string | null;
  full_name: string;
  role: "doctor" | "secretary";
  phone: string | null;
  avatar_url: string | null;
  clinic_id: string | null;
  doctor_id: string | null;
  expo_push_token: string | null;
}

// ── Patient ──────────────────────────────────────────────────

export interface Patient {
  id: string;
  doctor_id: string;
  full_name: string;
  dob: string | null;
  address: string | null;
  nino: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PatientCreate {
  full_name: string;
  dob?: string;
  address?: string;
  nino?: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export type PatientUpdate = Partial<PatientCreate>;

// ── Appointment ──────────────────────────────────────────────

export type AppointmentStatus = "scheduled" | "completed" | "cancelled";

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  patient_name: string | null;
  scheduled_at: string | null;
  status: AppointmentStatus;
  type: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppointmentCreate {
  patient_id: string;
  scheduled_at?: string;
  type?: string;
  notes?: string;
}

export interface AppointmentUpdate {
  scheduled_at?: string;
  status?: AppointmentStatus;
  type?: string;
  notes?: string;
}

// ── Medical Report ───────────────────────────────────────────

export type ReportStatus =
  | "pending"
  | "generating"
  | "ready"
  | "edited"
  | "approved"
  | "error";

export interface MedicalReport {
  id: string;
  appointment_id: string;
  template_id: string;
  patient_name: string | null;
  filled_json: Record<string, unknown>;
  docx_path: string | null;
  pdf_path: string | null;
  status: ReportStatus;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

// ── Dashboard ────────────────────────────────────────────────

export interface DashboardRecentReport {
  id: string;
  patient_name: string | null;
  status: ReportStatus;
  created_at: string;
}

export interface DashboardUpcomingAppointment {
  id: string;
  patient_name: string | null;
  scheduled_at: string | null;
  status: AppointmentStatus;
}

export interface DashboardStats {
  total_patients: number;
  total_reports: number;
  reports_this_month: number;
  upcoming_appointments: number;
  recent_reports: DashboardRecentReport[];
  upcoming_appointments_list: DashboardUpcomingAppointment[];
}

// ── Template ─────────────────────────────────────────────────

export type OnboardingStatus = "ready" | "pending" | "running" | "error";

export interface DoctorTemplate {
  id: string;
  doctor_id: string;
  name: string;
  docx_storage_path: string | null;
  placeholders: Record<string, { type: string; description: string }> | null;
  doctor_profile: Record<string, unknown> | null;
  is_active: boolean;
  is_default: boolean;
  onboarding_status: OnboardingStatus;
  onboarding_error: string | null;
  created_at: string;
  updated_at: string;
}

// ── Transcript ───────────────────────────────────────────────

export interface TranscriptListItem {
  id: string;
  recording_id: string;
  appointment_id: string | null;
  patient_name: string | null;
  appointment_scheduled_at: string | null;
  provider: string;
  duration_s: number | null;
  snippet: string | null;
  created_at: string;
}

export interface Transcript {
  id: string;
  recording_id: string;
  appointment_id: string | null;
  patient_name: string | null;
  appointment_scheduled_at: string | null;
  provider: string;
  paragraphs_text: string | null;
  utterances_text: string | null;
  duration_s: number | null;
  audio_url: string | null;
  created_at: string;
}

// ── Template onboarding ──────────────────────────────────────

export type OnboardingStep =
  | "upload"
  | "extract"
  | "architect"
  | "transform"
  | "finalize"
  | "done"
  | "error"
  | "connected";

export interface OnboardingSnapshot {
  step: OnboardingStep;
  message: string;
  progress: number;
}

// ── Notifications ────────────────────────────────────────────

export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
}

// ── Recording upload result ──────────────────────────────────

export interface RecordingUploadResult {
  recording_id: string;
  report_id: string;
  job_id: string;
  status: string;
}

// ── Pipeline ─────────────────────────────────────────────────

export type PipelineStep =
  | "transcribe"
  | "fill"
  | "generate"
  | "done"
  | "error"
  | "connected";

export type PipelineStatus = "running" | "done" | "error";
