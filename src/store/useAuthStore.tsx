import { create } from 'zustand';
import { api } from '@/lib/axios';

export const THEME_STORAGE_KEY = 'al_theme_id';
export const DEFAULT_THEME_ID = 'industrial-forge';

export const ALLOWED_THEMES = [
  'industrial-forge',
  'cyber-circuit',
  'cobalt-blueprint',
  'sovereign-vault',
  'acid-reactor',
] as const;

export type ThemeId = (typeof ALLOWED_THEMES)[number];

export function resolveThemeId(themeId?: string | null): ThemeId {
  if (themeId && (ALLOWED_THEMES as readonly string[]).includes(themeId)) {
    return themeId as ThemeId;
  }
  return DEFAULT_THEME_ID;
}

export function applyThemeToken(themeId?: string | null, persist = true) {
  if (typeof document === 'undefined') return;
  const resolved = resolveThemeId(themeId);
  document.documentElement.setAttribute('data-theme', resolved);
  if (!persist) return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, resolved);
  } catch {
    // ignore storage access errors
  }
}

export function clearThemeToken() {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', DEFAULT_THEME_ID);
  }
  try {
    localStorage.removeItem(THEME_STORAGE_KEY);
  } catch {
    // ignore storage access errors
  }
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  themeId?: ThemeId;
  monthlyBudget?: number;
  alertThreshold?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => {
    const resolvedTheme = resolveThemeId(user.themeId);
    applyThemeToken(resolvedTheme, true);
    set({
      user: {
        ...user,
        themeId: resolvedTheme,
        monthlyBudget: user.monthlyBudget ?? 50000,
        alertThreshold: user.alertThreshold ?? '80%',
      },
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error(error);
    } finally {
      clearThemeToken();
      set({ user: null, isAuthenticated: false, isLoading: false });
      window.location.href = '/login';
    }
  },

  checkAuth: async () => {
    try {
      const { data } = await api.get('/auth/profile');
      const resolvedTheme = resolveThemeId(data.themeId);
      applyThemeToken(resolvedTheme, true);
      set({
        user: {
          id: data._id || data.id,
          name: data.name,
          email: data.email,
          avatar: data.avatar,
          themeId: resolvedTheme,
          monthlyBudget: data.monthlyBudget ?? 50000,
          alertThreshold: data.alertThreshold ?? '80%',
        },
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      clearThemeToken();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));