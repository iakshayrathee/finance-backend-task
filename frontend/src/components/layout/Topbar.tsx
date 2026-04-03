'use client';

import { Bell } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Badge } from '@/components/ui/Badge';
import { useLiveStore } from '@/stores/liveStore';
import { roleBadgeClass } from '@/utils/roleColors';
import { cn } from '@/utils/cn';
import type { Role } from '@/types/api.types';

interface TopbarProps {
  title: string;
}

export function Topbar({ title }: TopbarProps) {
  const user        = useAuthStore((s) => s.user);
  const totalCount  = useLiveStore((s) => s.totalCount);
  const latestEvent = useLiveStore((s) => s.events[0]);

  // Connection status based on whether we've received any event
  const isConnected = totalCount > 0;

  return (
    <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-3.5 shrink-0">
      <h1 className="text-base font-semibold text-text-primary">{title}</h1>

      <div className="flex items-center gap-4">
        {/* SSE connection dot */}
        <div className="flex items-center gap-1.5" title={isConnected ? 'Live stream connected' : 'Connecting...'}>
          <span
            className={cn(
              'w-2 h-2 rounded-full',
              isConnected ? 'bg-success animate-pulse' : 'bg-warning animate-pulse'
            )}
          />
          <span className="text-xs text-text-muted hidden sm:block">
            {isConnected ? 'Live' : 'Connecting'}
          </span>
        </div>

        {/* Event counter */}
        {totalCount > 0 && (
          <Badge variant="indigo">
            {totalCount} events
          </Badge>
        )}

        {/* Latest event type */}
        {latestEvent && (
          <span className="hidden md:block text-xs text-text-muted font-mono truncate max-w-[160px]">
            ↳ {latestEvent.type}
          </span>
        )}

        {/* User role */}
        {user && (
          <span className={cn('text-xs font-bold px-2 py-1 rounded-full', roleBadgeClass[user.role as Role])}>
            {user.role}
          </span>
        )}
      </div>
    </header>
  );
}
