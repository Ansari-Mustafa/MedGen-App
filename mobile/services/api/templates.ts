import { api } from '@/lib/api';

export interface Template {
  id: string;
  doctor_id: string;
  name: string;
  placeholders: Record<string, unknown>;
  is_active: boolean;
}

export const getTemplates = (): Promise<Template[]> =>
  api.get('/templates').then((r) => r.data);
