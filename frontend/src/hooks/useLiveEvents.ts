'use client';

import { useEffect } from 'react';
import { useLiveStore } from '@/stores/liveStore';
import { sseManager } from '@/lib/api/live.api';
import { useAuthStore } from '@/stores/authStore';

/**
 * Subscribes the liveStore to incoming SSE events.
 * Call this once at the app root level when authenticated.
 */
export function useLiveEvents() {
  const pushEvent    = useLiveStore((s) => s.pushEvent);
  const accessToken  = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!accessToken) return;

    const unsub = sseManager.subscribe(pushEvent);
    // Ensure SSE is connected
    sseManager.connect(accessToken);

    return () => { unsub(); };
  }, [accessToken, pushEvent]);
}

/** Read-only access to the live event store state. */
export function useLiveState() {
  return useLiveStore();
}
