import { api } from '@/lib/api';

export const getAppointments = () => api.get('/appointments').then((r) => r.data);
export const getAppointment = (id: string) => api.get(`/appointments/${id}`).then((r) => r.data);
export const createAppointment = (data: object) => api.post('/appointments', data).then((r) => r.data);
export const updateAppointment = (id: string, data: object) => api.patch(`/appointments/${id}`, data).then((r) => r.data);
export const deleteAppointment = (id: string) => api.delete(`/appointments/${id}`);
