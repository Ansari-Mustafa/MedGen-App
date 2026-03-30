import { mockPatients } from '../data/patients';
import type { Patient, PatientCreate, PatientUpdate } from '@/types/models';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

let patients = [...mockPatients];
let nextId = patients.length + 1;

export async function getPatients(): Promise<Patient[]> {
  await delay(300);
  return patients.filter((p) => p.is_active);
}

export async function getPatient(id: number): Promise<Patient> {
  await delay(200);
  const patient = patients.find((p) => p.id === id);
  if (!patient) throw new Error('Patient not found');
  return patient;
}

export async function createPatient(data: PatientCreate): Promise<Patient> {
  await delay(500);
  const newPatient: Patient = {
    id: nextId++,
    doctor_id: 1,
    ...data,
    email: data.email ?? null,
    phone: data.phone ?? null,
    address: data.address ?? null,
    medical_record_number: data.medical_record_number ?? null,
    nhs_number: data.nhs_number ?? null,
    gender: data.gender ?? null,
    emergency_contact_name: null,
    emergency_contact_phone: null,
    notes: data.notes ?? null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  patients.push(newPatient);
  return newPatient;
}

export async function updatePatient(id: number, data: PatientUpdate): Promise<Patient> {
  await delay(400);
  const idx = patients.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error('Patient not found');
  patients[idx] = { ...patients[idx], ...data, updated_at: new Date().toISOString() };
  return patients[idx];
}

export async function deletePatient(id: number): Promise<void> {
  await delay(300);
  const idx = patients.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error('Patient not found');
  patients[idx] = { ...patients[idx], is_active: false };
}
