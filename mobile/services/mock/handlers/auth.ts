import { mockUser, mockTokens } from '../data/users';
import type { User, AuthTokens, LoginRequest, SignupRequest } from '@/types/models';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function login(data: LoginRequest): Promise<{ user: User; tokens: AuthTokens }> {
  await delay(500);
  if (data.email === 'dr.smith@medgen.com' && data.password === 'password') {
    return { user: mockUser, tokens: mockTokens };
  }
  // Accept any credentials in mock mode
  return { user: mockUser, tokens: mockTokens };
}

export async function signup(data: SignupRequest): Promise<{ user: User; tokens: AuthTokens }> {
  await delay(800);
  const newUser: User = {
    ...mockUser,
    email: data.email,
    first_name: data.first_name,
    last_name: data.last_name,
    title: data.title,
    specialty: data.specialty,
    onboarding_completed: false,
  };
  return { user: newUser, tokens: mockTokens };
}

export async function refreshToken(_refreshToken: string): Promise<AuthTokens> {
  await delay(200);
  return mockTokens;
}

export async function getProfile(): Promise<User> {
  await delay(300);
  return mockUser;
}

export async function updateProfile(data: Partial<User>): Promise<User> {
  await delay(400);
  return { ...mockUser, ...data };
}
