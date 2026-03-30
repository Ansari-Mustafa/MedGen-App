import type { User, AuthTokens } from '@/types/models';

export const mockUser: User = {
  id: 1,
  email: 'dr.smith@medgen.com',
  first_name: 'Sarah',
  last_name: 'Smith',
  title: 'Dr',
  specialty: 'General Practice',
  phone: '+44 7700 900123',
  license_number: 'GMC-7654321',
  profile_image_url: null,
  is_active: true,
  onboarding_completed: true,
  created_at: '2025-09-15T10:00:00Z',
  updated_at: '2026-02-20T14:30:00Z',
};

export const mockTokens: AuthTokens = {
  access_token: 'mock_access_token_xyz',
  refresh_token: 'mock_refresh_token_abc',
  token_type: 'bearer',
};
