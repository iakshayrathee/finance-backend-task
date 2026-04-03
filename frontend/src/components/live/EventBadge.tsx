'use client';

import { cn } from '@/utils/cn';
import { getEventColor, type EventColorCategory } from '@/types/events.types';
import { eventColorClass } from '@/utils/roleColors';

interface EventBadgeProps {
  type:      string;
  className?: string;
}

const EVENT_LABELS: Record<string, string> = {
  'user.registered':   'REGISTERED',
  'user.loggedIn':     'LOGIN',
  'user.loggedOut':    'LOGOUT',
  'token.refreshed':   'REFRESH',
  'record.created':    'CREATED',
  'record.updated':    'UPDATED',
  'record.deleted':    'DELETED',
  'user.roleChanged':  'ROLE CHANGE',
  'user.deactivated':  'DEACTIVATED',
  'dashboard.queried': 'QUERY',
  'api.error':         'ERROR',
  'system.connected':  'CONNECTED',
};

export function EventBadge({ type, className }: EventBadgeProps) {
  const color = getEventColor(type) as EventColorCategory;
  const { bg, text, border } = eventColorClass[color];
  const label = EVENT_LABELS[type] ?? type.toUpperCase().replace('.', '·');

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide font-mono',
        bg, text, border,
        className
      )}
    >
      {label}
    </span>
  );
}
