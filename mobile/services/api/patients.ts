import { api } from '@/lib/api';

export const getPatients = () => api.get('/patients').then((r) => r.data);
export const getPatient = (id: string) => api.get(`/patients/${id}`).then((r) => r.data);
export const createPatient = (data: object) => api.post('/patients', data).then((r) => r.data);
export const updatePatient = (id: string, data: object) => api.patch(`/patients/${id}`, data).then((r) => r.data);
export const deletePatient = (id: string) => api.delete(`/patients/${id}`);
