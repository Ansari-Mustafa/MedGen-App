import { create } from 'zustand';
import * as authApi from '@/services/api/auth';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';

export interface Profile {
  id: string;
  role: 'doctor' | 'secretary';
  full_name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  clinic_id: string | null;
  doctor_id: string | null;
  expo_push_token: string | null;
}

interface LoginInput {
  email: string;
  password: string;
}

// Compatible with signup.tsx which passes first_name, last_name, title, specialty
interface SignupInput {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  title?: string;
  specialty?: string;
}

interface AuthState {
  user: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (data: LoginInput) => Promise<void>;
  signup: (data: SignupInput) => Promise<void>;
  logout: (reason?: string) => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async ({ email, password }) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = await authApi.login({ email, password });
      set({ user: user as Profile, isAuthenticated: true, isLoading: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Login failed', isLoading: false });
    }
  },

  signup: async ({ email, password, first_name, last_name, title }) => {
    set({ isLoading: true, error: null });
    try {
      const parts = [title, first_name, last_name].filter(Boolean);
      const full_name = parts.join(' ');
      const { user } = await authApi.signup({ email, password, full_name, role: 'doctor' });
      set({ user: user as Profile, isAuthenticated: true, isLoading: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Signup failed', isLoading: false });
    }
  },

  logout: async (reason) => {
    await authApi.logout();
    set({ user: null, isAuthenticated: false, isLoading: false, error: reason ?? null });
  },

  loadStoredAuth: async () => {
    // Strict: if we can't verify the session against the backend, the user
    // must re-authenticate. Reset state at the top so stale values from
    // Metro fast-refresh can never leak an authenticated screen.
    set({ isLoading: true, isAuthenticated: false, user: null });
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        set({ isLoading: false, isAuthenticated: false, user: null });
        return;
      }
      try {
        const profile = await api.get('/me').then((r) => r.data);
        set({ user: profile as Profile, isAuthenticated: true, isLoading: false, error: null });
      } catch (err: any) {
        await supabase.auth.signOut();
        const status = err?.response?.status;
        const errorMessage = status
          ? 'Session expired. Please sign in again.'
          : 'Could not reach server. Please sign in again.';
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: errorMessage,
        });
      }
    } catch {
      set({ isLoading: false, isAuthenticated: false, user: null });
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await authApi.updateProfile(data as Parameters<typeof authApi.updateProfile>[0]);
      set({ user: updated as Profile, isLoading: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Update failed', isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
