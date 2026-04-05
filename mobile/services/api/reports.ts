import { api } from '@/lib/api';

export const getReports = () => api.get('/reports').then((r) => r.data);
export const getReport = (id: string) => api.get(`/reports/${id}`).then((r) => r.data);
export const saveEdits = (id: string, fields: Record<string, unknown>) =>
  api.patch(`/reports/${id}/fields`, { fields }).then((r) => r.data);
export const approveReport = (id: string) => api.post(`/reports/${id}/approve`).then((r) => r.data);
export const getDownloadUrl = (id: string, format: 'docx' | 'pdf' = 'docx') =>
  api.get(`/reports/${id}/download`, { params: { format } }).then((r) => r.data as { url: string; format: string });
