'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import type { LiveEvent } from '@/types/events.types';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

interface PayloadViewerProps {
  event: LiveEvent | null;
}

// Color-coded JSON renderer
function JsonValue({ value, depth = 0 }: { value: unknown; depth?: number }) {
  if (value === null)                 return <span className="text-slate-400">null</span>;
  if (typeof value === 'boolean')     return <span className="text-amber-400">{String(value)}</span>;
  if (typeof value === 'number')      return <span className="text-sky-400">{value}</span>;
  if (typeof value === 'string')      return <span className="text-green-400">&quot;{value}&quot;</span>;
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-text-muted">[]</span>;
    return (
      <span>
        {'['}
        <div className="ml-4">
          {value.map((v, i) => (
            <div key={i}>
              <JsonValue value={v} depth={depth + 1} />
              {i < value.length - 1 && <span className="text-text-muted">,</span>}
            </div>
          ))}
        </div>
        {']'}
      </span>
    );
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return <span className="text-text-muted">{'{}'}</span>;
    return (
      <span>
        {'{'}
        <div className="ml-4">
          {entries.map(([k, v], i) => (
            <div key={k}>
              <span className="text-indigo-400 font-mono">&quot;{k}&quot;</span>
              <span className="text-text-muted">: </span>
              <JsonValue value={v} depth={depth + 1} />
              {i < entries.length - 1 && <span className="text-text-muted">,</span>}
            </div>
          ))}
        </div>
        {'}'}
      </span>
    );
  }
  return <span className="text-text-muted">{String(value)}</span>;
}

const SERVICE_MAP: Record<string, string> = {
  'user.registered':   'AuthService → AuthRepository',
  'user.loggedIn':     'AuthService → AuthRepository',
  'user.loggedOut':    'AuthService → AuthRepository',
  'token.refreshed':   'AuthService → AuthRepository',
  'record.created':    'RecordService → RecordRepository',
  'record.updated':    'RecordService → RecordRepository',
  'record.deleted':    'RecordService → RecordRepository',
  'user.roleChanged':  'UserService → UserRepository',
  'user.deactivated':  'UserService → UserRepository',
  'dashboard.queried': 'DashboardService → DashboardRepository',
};

const DB_OP_MAP: Record<string, string> = {
  'user.registered':   'INSERT',
  'user.loggedIn':     'SELECT',
  'user.loggedOut':    'DELETE',
  'token.refreshed':   'SELECT → DELETE → INSERT',
  'record.created':    'INSERT',
  'record.updated':    'UPDATE',
  'record.deleted':    'UPDATE (soft)',
  'user.roleChanged':  'UPDATE',
  'user.deactivated':  'UPDATE (soft)',
  'dashboard.queried': 'SELECT (aggregate)',
};

export function PayloadViewer({ event }: PayloadViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!event) return;
    await navigator.clipboard.writeText(JSON.stringify(event, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-text-muted text-sm gap-2 p-8">
        <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center text-xl">
          {'{}'}
        </div>
        <p>Click an event to inspect its payload</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <h3 className="text-sm font-semibold text-text-primary">Payload Inspector</h3>
        <Button variant="ghost" size="sm" onClick={handleCopy} icon={copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}>
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>

      {/* Service trace */}
      <div className="rounded-xl border border-border bg-background p-3 text-xs shrink-0">
        <p className="text-text-muted mb-1">Handled by:</p>
        <p className="text-indigo-400 font-mono">{SERVICE_MAP[event.type] ?? 'Unknown Service'}</p>
        <p className="text-text-muted mt-1.5 mb-1">DB operation:</p>
        <p className="text-amber-400 font-mono">{DB_OP_MAP[event.type] ?? 'N/A'}</p>
      </div>

      {/* JSON viewer */}
      <div className="flex-1 overflow-auto rounded-xl border border-border bg-background p-4 font-mono text-xs leading-5">
        <JsonValue value={event} />
      </div>
    </div>
  );
}
