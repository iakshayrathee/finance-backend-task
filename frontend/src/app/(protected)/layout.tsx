'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { useAuthStore } from '@/stores/authStore';
import { useLiveEvents } from '@/hooks/useLiveEvents';
import { PageSpinner } from '@/components/ui/Spinner';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router        = useRouter();
  const pathname      = usePathname();
  const isHydrated    = useAuthStore((s) => s.isHydrated);
  const isLoggedIn    = useAuthStore((s) => s.isLoggedIn());

  const pageTitles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/records':   'Records',
    '/analytics': 'Analytics',
    '/users':     'Users',
    '/live':      'Live Monitor',
  };
  const pageTitle = pageTitles[pathname] ?? 'data';

  // Start SSE subscription for the entire protected area
  useLiveEvents();

  useEffect(() => {
    if (isHydrated && !isLoggedIn) {
      router.replace('/login');
    }
  }, [isHydrated, isLoggedIn, router]);

  if (!isHydrated) {
    return <PageSpinner />;
  }

  if (!isLoggedIn) {
    return null; // redirect in flight
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar title={pageTitle} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
