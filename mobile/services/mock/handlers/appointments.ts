import { mockAppointments } from '../data/appointments';
import type { Appointment, AppointmentCreate } from '@/types/models';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

let appointments = [...mockAppointments];
let nextId = appointments.length + 1;

export async function getAppointments(): Promise<Appointment[]> {
  await delay(300);
  return appointments;
}

export async function getAppointment(id: number): Promise<Appointment> {
  await delay(200);
  const appointment = appointments.find((a) => a.id === id);
  if (!appointment) throw new Error('Appointment not found');
  return appointment;
}

export async function createAppointment(data: AppointmentCreate): Promise<Appointment> {
  await delay(500);
  const newAppt: Appointment = {
    id: nextId++,
    doctor_id: 1,
    ...data,
    patient_name: `Patient ${data.patient_id}`,
    clinic_id: data.clinic_id ?? null,
    clinic_name: data.clinic_id ? 'Central Medical Practice' : null,
    priority: data.priority ?? 'routine',
    reason: data.reason ?? null,
    notes: data.notes ?? null,
    status: 'scheduled',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  appointments.push(newAppt);
  return newAppt;
}

export async function updateAppointmentStatus(
  id: number,
  status: Appointment['status']
): Promise<Appointment> {
  await delay(300);
  const idx = appointments.findIndex((a) => a.id === id);
  if (idx === -1) throw new Error('Appointment not found');
  appointments[idx] = { ...appointments[idx], status, updated_at: new Date().toISOString() };
  return appointments[idx];
}
