import { mockReports } from '../data/reports';
import type { MedicalReport, ReportUpdate } from '@/types/models';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

let reports = [...mockReports];

export async function getReports(): Promise<MedicalReport[]> {
  await delay(300);
  return reports.filter((r) => r.current_version);
}

export async function getReport(id: number): Promise<MedicalReport> {
  await delay(200);
  const report = reports.find((r) => r.id === id);
  if (!report) throw new Error('Report not found');
  return report;
}

export async function updateReport(id: number, data: ReportUpdate): Promise<MedicalReport> {
  await delay(400);
  const idx = reports.findIndex((r) => r.id === id);
  if (idx === -1) throw new Error('Report not found');
  reports[idx] = { ...reports[idx], ...data, updated_at: new Date().toISOString() };
  return reports[idx];
}

export async function deleteReport(id: number): Promise<void> {
  await delay(300);
  reports = reports.filter((r) => r.id !== id);
}

export async function getReportVersions(reportId: number): Promise<MedicalReport[]> {
  await delay(200);
  return reports.filter((r) => r.id === reportId || r.title === reports.find((rr) => rr.id === reportId)?.title);
}
