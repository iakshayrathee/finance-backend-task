'use client';

import { useEffect, useRef, useState } from 'react';
import { Pause, Play, Filter, Trash2, Wifi, WifiOff } from 'lucide-react';
import { useLiveStore } from '@/stores/liveStore';
import { useLiveEvents } from '@/hooks/useLiveEvents';
import { ApiCallLog } from './ApiCallLog';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import type { EventTypeName } from '@/types/events.types';
import { EventType } from '@/types/events.types';
import { useAuthStore } from '@/stores/authStore';

const FILTER_OPTIONS: Array<{ label: string; value: EventTypeName | null }> = [
  { label: 'All', value: null },
  { label: 'Auth',      value: EventType.USER_LOGGED_IN },
  { label: 'Records',   value: EventType.RECORD_CREATED },
  { label: 'Dashboard', value: EventType.DASHBOARD_QUERIED },
  { label: 'Errors',    value: EventType.API_ERROR },
];

interface BackendActivityFeedProps {
  maxHeight?: string;
  compact?:   boolean;  // Mini mode for dashboard corner
}

export function BackendActivityFeed({ maxHeight = '100%', compact = false }: BackendActivityFeedProps) {
  // Register SSE listener
  useLiveEvents();

  const {
    isPaused, activeFilter,
    setPaused, setFilter, clearEvents, selectEvent, selectedEvent,
    filteredEvents,
  } = useLiveStore();

  const accessToken  = useAuthStore((s) => s.accessToken);
  const [connected, setConnected] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const events  = filteredEvents();

  // Track SSE connection status via 'system.connected' event
  useEffect(() => {
    const unsub = useLiveStore.subscribe((state) => {
      const latest = state.events[0];
      if (latest?.type === 'system.connected') setConnected(true);
    });
    if (!accessToken) setConnected(false);
    return unsub;
  }, [accessToken]);

  // Auto-scroll to top (newest event is first)
  useEffect(() => {
    if (!isPaused && listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [events.length, isPaused]);

  // Connection status dot
  const dot = connected
    ? 'bg-success animate-pulse'
    : accessToken
    ? 'bg-warning animate-pulse'
    : 'bg-danger';

  return (
    <div className="flex flex-col gap-3 h-full overflow-hidden">
      {/* Toolbar */}
      {!compact && (
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Connection status */}
          <div className="flex items-center gap-1.5 mr-auto">
            <span className={cn('w-2 h-2 rounded-full', dot)} />
            <span className="text-xs text-text-muted">
              {connected ? 'Live' : accessToken ? 'Connecting…' : 'Disconnected'}
            </span>
          </div>

          {/* Filter pills */}
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              onClick={() => setFilter(activeFilter === opt.value ? null : opt.value)}
              className={cn(
                'text-xs px-2.5 py-1 rounded-full border transition-colors',
                activeFilter === opt.value
                  ? 'bg-primary border-primary text-white'
                  : 'border-border text-text-muted hover:border-primary/50 hover:text-text-primary'
              )}
            >
              {opt.label}
            </button>
          ))}

          <Button variant="ghost" size="sm" onClick={() => setPaused(!isPaused)}>
            {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
          </Button>

          <Button variant="ghost" size="sm" onClick={clearEvents}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      )}

      {/* Event list */}
      <div
        ref={listRef}
        style={{ maxHeight }}
        className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border"
      >
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-text-muted text-xs gap-2">
            <WifiOff className="w-5 h-5" />
            <p>Waiting for events...</p>
          </div>
        ) : (
          events.slice(0, compact ? 5 : events.length).map((event) => (
            <ApiCallLog
              key={event.id}
              event={event}
              isSelected={selectedEvent?.id === event.id}
              onClick={() => selectEvent(selectedEvent?.id === event.id ? null : event)}
            />
          ))
        )}
      </div>
    </div>
  );
}
