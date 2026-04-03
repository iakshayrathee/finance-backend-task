'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useEffect, useRef } from 'react';
import { initApiClientWithStore, useAuthStore } from '@/stores/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:           60_000,
      retry:               1,
      refetchOnWindowFocus: false,
    },
  },
});

function AuthHydrator() {
  useEffect(() => {
    // Hydrate auth store from localStorage
    const storedUser = localStorage.getItem('auth-user');
    const storedAccessToken = localStorage.getItem('auth-accessToken');
    const storedRefreshToken = localStorage.getItem('auth-refreshToken');

    if (storedUser && storedAccessToken) {
      try {
        const user = JSON.parse(storedUser);
        useAuthStore.setState({
          user,
          accessToken: storedAccessToken,
          refreshToken: storedRefreshToken,
        });
        useAuthStore.getState().setHydrated();
      } catch (error) {
        console.error('Failed to hydrate auth store:', error);
        useAuthStore.getState().setHydrated();
      }
    } else {
      useAuthStore.getState().setHydrated();
    }
  }, []);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initApiClientWithStore();
      initialized.current = true;
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthHydrator />
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background:  '#1a1d27',
            color:       '#e2e8f0',
            border:      '1px solid #2a2d3e',
            borderRadius: '12px',
            fontSize:    '13px',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#0f1117' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#0f1117' } },
        }}
      />
    </QueryClientProvider>
  );
}
