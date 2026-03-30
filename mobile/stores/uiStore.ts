import { create } from 'zustand';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface UIState {
  theme: 'light' | 'dark' | 'auto';
  toasts: Toast[];
  isGlobalLoading: boolean;

  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  showToast: (message: string, type?: Toast['type']) => void;
  dismissToast: (id: string) => void;
  setGlobalLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  theme: 'light',
  toasts: [],
  isGlobalLoading: false,

  setTheme: (theme) => set({ theme }),

  showToast: (message, type = 'info') =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { id: Date.now().toString(), message, type },
      ],
    })),

  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  setGlobalLoading: (loading) => set({ isGlobalLoading: loading }),
}));
