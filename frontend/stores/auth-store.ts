"use client";

import { create } from "zustand";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getMe, setupProfile } from "@/lib/api/endpoints/me";
import { extractApiError } from "@/lib/utils/errors";
import type { User } from "@/types/models";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;
  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (args: {
    email: string;
    password: string;
    fullName: string;
    role: "doctor" | "secretary";
    doctorId?: string;
  }) => Promise<void>;
  logout: (message?: string) => Promise<void>;
  setUser: (user: User | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isHydrated: false,
  error: null,

  bootstrap: async () => {
    set({ isLoading: true, error: null });
    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        set({ user: null, isAuthenticated: false, isLoading: false, isHydrated: true });
        return;
      }
      const user = await getMe();
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        isHydrated: true,
      });
    } catch (err) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isHydrated: true,
        error: extractApiError(err),
      });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const user = await getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: extractApiError(err, "Sign in failed") });
      throw err;
    }
  },

  signup: async ({ email, password, fullName, role, doctorId }) => {
    set({ isLoading: true, error: null });
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (!data.session) {
        set({
          isLoading: false,
          error: "Check your email to confirm your account before signing in.",
        });
        return;
      }
      const user = await setupProfile({
        full_name: fullName,
        role,
        doctor_id: doctorId,
      });
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: extractApiError(err, "Sign up failed") });
      throw err;
    }
  },

  logout: async (message) => {
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    set({
      user: null,
      isAuthenticated: false,
      error: message ?? null,
      isLoading: false,
    });
  },

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  clearError: () => set({ error: null }),
}));

export const selectIsDoctor = () => useAuthStore.getState().user?.role === "doctor";
