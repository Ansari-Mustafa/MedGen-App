// ── User / Auth ──────────────────────────────────────────────

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  title: string;
  specialty: string;
  phone: string;
  license_number: string;
  profile_image_url: string | null;
  is_active: boolean;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  title: string;
  specialty: string;
}

// ── Patient ──────────────────────────────────────────────────

export interface Patient {
  id: number;
  doctor_id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  medical_record_number: string | null;
  nhs_number: string | null;
  gender: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PatientCreate {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  email?: string;
  phone?: string;
  address?: string;
  medical_record_number?: string;
  nhs_number?: string;
  gender?: string;
  notes?: string;
}

export type PatientUpdate = Partial<PatientCreate>;

// ── Medical Report ───────────────────────────────────────────

export interface MedicalReport {
  id: number;
  doctor_id: number;
  patient_id: number;
  patient_name: string;
  template_id: number | null;
  recording_id: number | null;
  transcription_id: number | null;
  title: string;
  content: string;
  format: 'html' | 'markdown' | 'text';
  status: 'generating' | 'generated' | 'reviewed' | 'approved' | 'exported';
  version: number;
  current_version: boolean;
  report_date: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ReportUpdate {
  title?: string;
  content?: string;
  status?: MedicalReport['status'];
}

// ── Audio / Recording ────────────────────────────────────────

export interface AudioRecording {
  id: number;
  doctor_id: number;
  patient_id: number;
  patient_name: string;
  session_name: string;
  file_path: string;
  file_size: number;
  duration: number;
  format: string;
  quality_score: number | null;
  status: 'uploaded' | 'processing' | 'transcribed' | 'failed';
  created_at: string;
}

// ── Transcription ────────────────────────────────────────────

export interface Transcription {
  id: number;
  recording_id: number;
  doctor_id: number;
  patient_id: number;
  content: string;
  word_count: number;
  confidence_score: number | null;
  language: string;
  speaker_labels: Record<string, string> | null;
  status: 'processing' | 'completed' | 'failed';
  created_at: string;
}

// ── Appointment ──────────────────────────────────────────────

export interface Appointment {
  id: number;
  doctor_id: number;
  patient_id: number;
  patient_name: string;
  clinic_id: number | null;
  clinic_name: string | null;
  appointment_date: string;
  start_time: string;
  end_time: string;
  appointment_type: 'consultation' | 'follow_up' | 'review' | 'procedure';
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  priority: 'routine' | 'urgent' | 'emergency';
  reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppointmentCreate {
  patient_id: number;
  clinic_id?: number;
  appointment_date: string;
  start_time: string;
  end_time: string;
  appointment_type: Appointment['appointment_type'];
  priority?: Appointment['priority'];
  reason?: string;
  notes?: string;
}

// ── Subscription ─────────────────────────────────────────────

export interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  price: number;
  billing_cycle: 'monthly' | 'yearly';
  reports_limit: number;
  recordings_limit: number;
  storage_limit_mb: number;
  features: string[];
  is_active: boolean;
}

export interface UserSubscription {
  id: number;
  user_id: number;
  plan_id: number;
  plan_name: string;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  current_period_start: string;
  current_period_end: string;
  reports_used: number;
  reports_limit: number;
  recordings_used: number;
  recordings_limit: number;
}

// ── Template ─────────────────────────────────────────────────

export interface DoctorTemplate {
  id: number;
  doctor_id: number;
  name: string;
  description: string | null;
  template_type: string;
  content: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ── Clinic ───────────────────────────────────────────────────

export interface Clinic {
  id: number;
  name: string;
  address: string;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
}

// ── Dashboard Stats ──────────────────────────────────────────

export interface DashboardStats {
  total_patients: number;
  total_reports: number;
  reports_this_month: number;
  upcoming_appointments: number;
  recent_reports: MedicalReport[];
  upcoming_appointments_list: Appointment[];
}
