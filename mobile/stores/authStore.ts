import { create } from 'zustand';
import { authService } from '@/services';
import {
  getAccessToken,
  setAccessToken,
  setRefreshToken,
  clearTokens,
  getStoredUser,
  setStoredUser,
  clearStoredUser,
} from '@/utils/storage';
import type { User, LoginRequest, SignupRequest } from '@/types/models';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (data: LoginRequest) => Promise<void>;
  signup: (data: SignupRequest) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authService.login(data);
      await setAccessToken(result.tokens.access_token);
      await setRefreshToken(result.tokens.refresh_token);
      await setStoredUser(JSON.stringify(result.user));
      set({ user: result.user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Login failed',
        isLoading: false,
      });
    }
  },

  signup: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authService.signup(data);
      await setAccessToken(result.tokens.access_token);
      await setRefreshToken(result.tokens.refresh_token);
      await setStoredUser(JSON.stringify(result.user));
      set({ user: result.user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Signup failed',
        isLoading: false,
      });
    }
  },

  logout: async () => {
    await clearTokens();
    await clearStoredUser();
    set({ user: null, isAuthenticated: false, isLoading: false, error: null });
  },

  loadStoredAuth: async () => {
    try {
      const token = await getAccessToken();
      const userData = await getStoredUser();
      if (token && userData) {
        const user = JSON.parse(userData) as User;
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await authService.updateProfile(data);
      await setStoredUser(JSON.stringify(updated));
      set({ user: updated, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Update failed',
        isLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
