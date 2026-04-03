'use client';

import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';

// ── Axios instance ─────────────────────────────────────────────────────────────

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
});

// ── Token getter/setter (avoids circular dep with stores) ──────────────────────

let _getAccessToken: (() => string | null) | null = null;
let _getRefreshToken: (() => string | null) | null = null;
let _setTokens: ((access: string, refresh: string) => void) | null = null;
let _clearAuth: (() => void) | null = null;

export function configureApiClient(opts: {
  getAccessToken:  () => string | null;
  getRefreshToken: () => string | null;
  setTokens:       (access: string, refresh: string) => void;
  clearAuth:       () => void;
}) {
  _getAccessToken  = opts.getAccessToken;
  _getRefreshToken = opts.getRefreshToken;
  _setTokens       = opts.setTokens;
  _clearAuth       = opts.clearAuth;
}

// ── Request interceptor: attach Bearer token ───────────────────────────────────

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = _getAccessToken?.();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// ── Track if we're already refreshing to prevent loops ───────────────────────

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

function processQueue(token: string) {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
}

// ── Response interceptor: auto-refresh on 401 ────────────────────────────────

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    const refreshToken = _getRefreshToken?.();
    if (!refreshToken) {
      _clearAuth?.();
      if (typeof window !== 'undefined') window.location.href = '/login';
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Wait for the ongoing refresh to complete, then retry
      return new Promise((resolve) => {
        refreshQueue.push((token: string) => {
          if (original.headers) {
            original.headers['Authorization'] = `Bearer ${token}`;
          }
          resolve(apiClient(original));
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post<{
        success: boolean;
        data: { accessToken: string; refreshToken: string };
      }>(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api'}/auth/refresh`,
        { refreshToken }
      );

      const newAccess  = data.data.accessToken;
      const newRefresh = data.data.refreshToken;

      _setTokens?.(newAccess, newRefresh);
      processQueue(newAccess);

      if (original.headers) {
        original.headers['Authorization'] = `Bearer ${newAccess}`;
      }
      return apiClient(original);
    } catch {
      refreshQueue = [];
      _clearAuth?.();
      toast.error('Session expired — please log in again.');
      if (typeof window !== 'undefined') window.location.href = '/login';
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  }
);

export default apiClient;
