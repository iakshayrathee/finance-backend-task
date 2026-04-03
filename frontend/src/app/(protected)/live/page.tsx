'use client';

import { useMemo } from 'react';
import { Activity, Zap, AlertTriangle, Users, BarChart2 } from 'lucide-react';
import { BackendActivityFeed } from '@/components/live/BackendActivityFeed';
import { PayloadViewer } from '@/components/live/PayloadViewer';
import { useLiveStore } from '@/stores/liveStore';
import { EventType } from '@/types/events.types';
import { formatCurrency } from '@/utils/formatCurrency';

// ── Right panel: live stats derived from event history ────────────────────────

function LiveStats() {
  const events     = useLiveStore((s) => s.events);
  const totalCount = useLiveStore((s) => s.totalCount);
  const errorCount = useLiveStore((s) => s.errorCount);

  const stats = useMemo(() => {
    // Events in last 60 seconds
    const now = Date.now();
    const recentMs = 60_000;
    const recentEvents = events.filter(
      (e) => now - new Date(e.timestamp).getTime() < recentMs
    );

    // Unique active users (actors with an id from last 5 minutes)
    const fiveMin = 5 * 60_000;
    const activeUserIds = new Set<string>();
    events
      .filter((e) => now - new Date(e.timestamp).getTime() < fiveMin)
      .forEach((e) => {
        if (e.actor && typeof e.actor === 'object' && e.actor.id) {
          activeUserIds.add(e.actor.id);
        }
      });

    // Event type breakdown
    const typeCounts: Record<string, number> = {};
    events.forEach((e) => {
      typeCounts[e.type] = (typeCounts[e.type] ?? 0) + 1;
    });
    const topTypes = Object.entries(typeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    // Auth event count
    const authEvents = events.filter(
      (e) =>
        e.type === EventType.USER_LOGGED_IN ||
        e.type === EventType.USER_REGISTERED ||
        e.type === EventType.TOKEN_REFRESHED
    ).length;

    // Record mutations
    const recordMutations = events.filter(
      (e) =>
        e.type === EventType.RECORD_CREATED ||
        e.type === EventType.RECORD_UPDATED ||
        e.type === EventType.RECORD_DELETED
    ).length;

    const errorRate = totalCount > 0 ? ((errorCount / totalCount) * 100).toFixed(1) : '0.0';

    return {
      eventsPerMin:  recentEvents.length,
      activeUsers:   activeUserIds.size,
      errorRate,
      topTypes,
      authEvents,
      recordMutations,
    };
  }, [events, totalCount, errorCount]);

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto">
      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface-2 border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-3.5 h-3.5 text-warning" />
            <span className="text-xs text-muted">Events / min</span>
          </div>
          <p className="text-2xl font-bold text-text-primary font-mono">{stats.eventsPerMin}</p>
        </div>

        <div className="bg-surface-2 border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-muted">Active users</span>
          </div>
          <p className="text-2xl font-bold text-text-primary font-mono">{stats.activeUsers}</p>
        </div>

        <div className="bg-surface-2 border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-danger" />
            <span className="text-xs text-muted">Error rate</span>
          </div>
          <p className={`text-2xl font-bold font-mono ${parseFloat(stats.errorRate) > 5 ? 'text-danger' : 'text-text-primary'}`}>
            {stats.errorRate}%
          </p>
        </div>

        <div className="bg-surface-2 border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-3.5 h-3.5 text-success" />
            <span className="text-xs text-muted">Total events</span>
          </div>
          <p className="text-2xl font-bold text-text-primary font-mono">{totalCount}</p>
        </div>
      </div>

      {/* Top event types */}
      <div className="bg-surface-2 border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart2 className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium text-text-primary">Top Event Types</span>
        </div>
        {stats.topTypes.length === 0 ? (
          <p className="text-xs text-muted">Waiting for events…</p>
        ) : (
          <div className="space-y-2">
            {stats.topTypes.map(([type, count]) => {
              const maxCount = stats.topTypes[0]?.[1] ?? 1;
              const pct = Math.round((count / maxCount) * 100);
              return (
                <div key={type}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted font-mono truncate">{type}</span>
                    <span className="text-text-primary font-bold">{count}</span>
                  </div>
                  <div className="h-1.5 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Category breakdown */}
      <div className="bg-surface-2 border border-border rounded-xl p-4">
        <p className="text-xs font-medium text-text-primary mb-3">Event Categories</p>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted">Auth events</span>
            <span className="text-indigo-400 font-bold font-mono">{stats.authEvents}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Record mutations</span>
            <span className="text-success font-bold font-mono">{stats.recordMutations}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Error events</span>
            <span className="text-danger font-bold font-mono">{errorCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Live Monitor page ─────────────────────────────────────────────────────

export default function LivePage() {
  const selectedEvent = useLiveStore((s) => s.selectedEvent);

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Page Header */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
        <h1 className="text-2xl font-bold text-text-primary">Live Monitor</h1>
        <span className="text-xs text-muted bg-surface border border-border rounded-full px-3 py-1">
          Real-time backend activity stream
        </span>
      </div>

      {/* 3-panel layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.2fr_280px] gap-4 flex-1 min-h-0">
        {/* Left: Activity Feed */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden flex flex-col min-h-0">
          <div className="px-4 py-3 border-b border-border shrink-0">
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Event Stream
            </h2>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <BackendActivityFeed maxHeight="100%" />
          </div>
        </div>

        {/* Middle: Payload Inspector */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden flex flex-col min-h-0">
          <div className="px-4 py-3 border-b border-border shrink-0">
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Zap className="w-4 h-4 text-warning" />
              Payload Inspector
              {selectedEvent && (
                <span className="ml-auto text-xs text-muted font-mono">
                  {selectedEvent.type}
                </span>
              )}
            </h2>
          </div>
          <div className="flex-1 min-h-0 overflow-auto p-4">
            <PayloadViewer event={selectedEvent} />
          </div>
        </div>

        {/* Right: Live Stats */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden flex flex-col min-h-0">
          <div className="px-4 py-3 border-b border-border shrink-0">
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-success" />
              Live Stats
            </h2>
          </div>
          <div className="flex-1 min-h-0 overflow-auto p-4">
            <LiveStats />
          </div>
        </div>
      </div>
    </div>
  );
}
