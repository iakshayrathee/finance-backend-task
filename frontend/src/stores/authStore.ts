'use client';

import { create } from 'zustand';
import type { SafeUser } from '@/types/api.types';
import { configureApiClient } from '@/lib/api/client';
import { sseManager } from '@/lib/api/live.api';

interface AuthState {
  user:         SafeUser | null;
  accessToken:  string | null;
  refreshToken: string | null;
  isHydrated:   boolean;
}

interface AuthActions {
  login:        (user: SafeUser, accessToken: string, refreshToken: string) => void;
  logout:       () => void;
  setTokens:    (accessToken: string, refreshToken: string) => void;
  setHydrated:  () => void;
  isLoggedIn:   () => boolean;
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  // ── State ──────────────────────────────────────────────────────────────────
  user:         null,
  accessToken:  null,
  refreshToken: null,
  isHydrated:   false,

  // ── Actions ────────────────────────────────────────────────────────────────
  login: (user, accessToken, refreshToken) => {
    // Persist to localStorage
    localStorage.setItem('auth-user', JSON.stringify(user));
    localStorage.setItem('auth-accessToken', accessToken);
    localStorage.setItem('auth-refreshToken', refreshToken);
    
    set({ user, accessToken, refreshToken });
    // Connect SSE stream on login
    sseManager.connect(accessToken);
  },

  logout: () => {
    // Clear localStorage
    localStorage.removeItem('auth-user');
    localStorage.removeItem('auth-accessToken');
    localStorage.removeItem('auth-refreshToken');
    
    set({ user: null, accessToken: null, refreshToken: null });
    sseManager.disconnect();
  },

  setTokens: (accessToken, refreshToken) => {
    // Persist new tokens to localStorage
    localStorage.setItem('auth-accessToken', accessToken);
    localStorage.setItem('auth-refreshToken', refreshToken);
    
    set({ accessToken, refreshToken });
    // Reconnect SSE with new access token
    sseManager.connect(accessToken);
  },

  setHydrated: () => set({ isHydrated: true }),

  isLoggedIn: () => Boolean(get().accessToken && get().user),
}));

// ── Wire Axios interceptors to store state ─────────────────────────────────────
// Called once from providers.tsx after the store is initialized
export function initApiClientWithStore() {
  configureApiClient({
    getAccessToken:  () => useAuthStore.getState().accessToken,
    getRefreshToken: () => useAuthStore.getState().refreshToken,
    setTokens:       (a, r) => useAuthStore.getState().setTokens(a, r),
    clearAuth:       () => useAuthStore.getState().logout(),
  });
}
