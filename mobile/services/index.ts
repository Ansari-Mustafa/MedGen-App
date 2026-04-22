import * as apiAuth from './api/auth';
import * as apiPatients from './api/patients';
import * as apiReports from './api/reports';
import * as apiAppointments from './api/appointments';

export const authService = apiAuth;
export const patientService = apiPatients;
export const reportService = apiReports;
export const appointmentService = apiAppointments;
