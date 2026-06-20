import { api } from "@/lib/api/client";
import type {
  Appointment,
  AppointmentCreate,
  AppointmentUpdate,
} from "@/types/models";

export async function listAppointments(): Promise<Appointment[]> {
  const { data } = await api.get<Appointment[]>("/appointments");
  return data;
}

export async function getAppointment(id: string): Promise<Appointment> {
  const { data } = await api.get<Appointment>(`/appointments/${id}`);
  return data;
}

export async function createAppointment(
  payload: AppointmentCreate
): Promise<Appointment> {
  const { data } = await api.post<Appointment>("/appointments", payload);
  return data;
}

export async function updateAppointment(
  id: string,
  payload: AppointmentUpdate
): Promise<Appointment> {
  const { data } = await api.patch<Appointment>(`/appointments/${id}`, payload);
  return data;
}

export async function deleteAppointment(id: string): Promise<void> {
  await api.delete(`/appointments/${id}`);
}
