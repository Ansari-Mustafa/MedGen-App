import { USE_MOCK } from '@/constants/config';

// Mock services
import * as mockAuth from './mock/handlers/auth';
import * as mockPatients from './mock/handlers/patients';
import * as mockReports from './mock/handlers/reports';
import * as mockAppointments from './mock/handlers/appointments';
import * as mockDashboard from './mock/handlers/dashboard';

// Real API services
import * as apiAuth from './api/auth';
import * as apiPatients from './api/patients';
import * as apiReports from './api/reports';
import * as apiAppointments from './api/appointments';

export const authService = USE_MOCK ? mockAuth : apiAuth;
export const patientService = USE_MOCK ? mockPatients : apiPatients;
export const reportService = USE_MOCK ? mockReports : apiReports;
export const appointmentService = USE_MOCK ? mockAppointments : apiAppointments;

// Dashboard is mock-only until a real /dashboard endpoint is added
export const dashboardService = mockDashboard;
