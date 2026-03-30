import { USE_MOCK } from '@/constants/config';

// Mock services
import * as mockAuth from './mock/handlers/auth';
import * as mockPatients from './mock/handlers/patients';
import * as mockReports from './mock/handlers/reports';
import * as mockAppointments from './mock/handlers/appointments';
import * as mockDashboard from './mock/handlers/dashboard';

// Real API services (stubs for now — will be implemented in Phase 6)
// import * as apiAuth from './api/auth';
// import * as apiPatients from './api/patients';
// import * as apiReports from './api/reports';
// import * as apiAppointments from './api/appointments';
// import * as apiDashboard from './api/dashboard';

export const authService = USE_MOCK ? mockAuth : mockAuth;
export const patientService = USE_MOCK ? mockPatients : mockPatients;
export const reportService = USE_MOCK ? mockReports : mockReports;
export const appointmentService = USE_MOCK ? mockAppointments : mockAppointments;
export const dashboardService = USE_MOCK ? mockDashboard : mockDashboard;
