import { mockPatients } from '../data/patients';
import { mockReports } from '../data/reports';
import { mockAppointments } from '../data/appointments';
import type { DashboardStats } from '@/types/models';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function getDashboardStats(): Promise<DashboardStats> {
  await delay(400);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const reportsThisMonth = mockReports.filter(
    (r) => new Date(r.created_at) >= monthStart
  ).length;

  const upcomingAppts = mockAppointments.filter(
    (a) => new Date(a.appointment_date) >= now && a.status !== 'cancelled'
  );

  return {
    total_patients: mockPatients.filter((p) => p.is_active).length,
    total_reports: mockReports.length,
    reports_this_month: reportsThisMonth,
    upcoming_appointments: upcomingAppts.length,
    recent_reports: mockReports.slice(0, 3),
    upcoming_appointments_list: upcomingAppts.slice(0, 3),
  };
}
