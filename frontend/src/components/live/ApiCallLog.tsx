'use client';

import type { LiveEvent } from '@/types/events.types';
import { EventBadge } from './EventBadge';
import { timeAgoShort } from '@/utils/formatDate';
import { cn } from '@/utils/cn';
import { roleBadgeClass } from '@/utils/roleColors';
import type { Role } from '@/types/api.types';

interface ApiCallLogProps {
  event:     LiveEvent;
  isSelected: boolean;
  onClick:   () => void;
}

export function ApiCallLog({ event, isSelected, onClick }: ApiCallLogProps) {
  const actorInfo = event.actor === 'system' ? null : event.actor;
  const actorRole = actorInfo?.role as Role | undefined;

  return (
    <div
      onClick={onClick}
      className={cn(
        'animate-slide-in-right cursor-pointer rounded-xl border p-3 transition-colors',
        'hover:border-primary/50',
        isSelected
          ? 'border-primary/70 bg-primary/10'
          : 'border-border bg-surface hover:bg-white/5'
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <EventBadge type={event.type} />
        <span className="text-[10px] text-text-muted shrink-0">{timeAgoShort(event.timestamp)}</span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {actorInfo ? (
          <>
            <span className="text-xs text-text-primary truncate max-w-[140px]">
              {actorInfo.email ?? actorInfo.id.slice(0, 8)}
            </span>
            {actorRole && (
              <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-bold', roleBadgeClass[actorRole])}>
                {actorRole}
              </span>
            )}
          </>
        ) : (
          <span className="text-xs text-text-muted">system</span>
        )}
      </div>

      {event.meta?.path && (
        <div className="flex items-center gap-2 mt-2">
          {event.meta.method && (
            <span className="font-mono text-[9px] text-amber-400 bg-amber-500/10 rounded px-1.5 py-0.5">
              {event.meta.method}
            </span>
          )}
          <span className="font-mono text-[10px] text-text-muted truncate">{event.meta.path}</span>
          {event.meta.durationMs !== undefined && (
            <span className="text-[9px] text-text-muted ml-auto shrink-0">
              {event.meta.durationMs}ms
            </span>
          )}
        </div>
      )}
    </div>
  );
}
