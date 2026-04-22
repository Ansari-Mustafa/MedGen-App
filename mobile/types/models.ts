// ── User / Profile ───────────────────────────────────────────

export interface User {
  id: string;
  email: string | null;
  full_name: string;
  role: 'doctor' | 'secretary';
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

export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled';

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

export type ReportStatus = 'pending' | 'generating' | 'ready' | 'approved' | 'error';

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

export interface DoctorTemplate {
  id: string;
  doctor_id: string;
  name: string;
  docx_storage_path: string | null;
  placeholders: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
