// ── Event type constants ───────────────────────────────────────────────────────

export const EventType = {
  // Auth
  USER_REGISTERED: 'user.registered',
  USER_LOGGED_IN:  'user.loggedIn',
  USER_LOGGED_OUT: 'user.loggedOut',
  TOKEN_REFRESHED: 'token.refreshed',
  // Records
  RECORD_CREATED:  'record.created',
  RECORD_UPDATED:  'record.updated',
  RECORD_DELETED:  'record.deleted',
  // Users
  USER_ROLE_CHANGED: 'user.roleChanged',
  USER_DEACTIVATED:  'user.deactivated',
  // Dashboard
  DASHBOARD_QUERIED: 'dashboard.queried',
  // System
  API_ERROR:         'api.error',
  SYSTEM_CONNECTED:  'system.connected',
} as const;

export type EventTypeName = (typeof EventType)[keyof typeof EventType];

// ── Actor shape (mirrored from live.service.ts) ───────────────────────────────

export interface ActorInfo {
  id:     string;
  email?: string;
  role?:  string;
}

// ── Event meta ────────────────────────────────────────────────────────────────

export interface EventMeta {
  method?:     string;
  path?:       string;
  statusCode?: number;
  durationMs?: number;
}

// ── Main SSE Event shape ───────────────────────────────────────────────────────

export interface LiveEvent {
  id:        string;
  type:      string;
  timestamp: string;
  actor:     ActorInfo | 'system';
  payload:   Record<string, unknown>;
  meta?:     EventMeta;
}

// ── Color categories for UI ───────────────────────────────────────────────────

export type EventColorCategory =
  | 'green'    // create events
  | 'blue'     // read/query events
  | 'yellow'   // update events
  | 'red'      // delete events
  | 'purple'   // auth events
  | 'gray';    // system events

export function getEventColor(type: string): EventColorCategory {
  if (type.includes('created')   || type.includes('registered'))  return 'green';
  if (type.includes('queried')   || type.includes('loggedIn'))     return 'blue';
  if (type.includes('updated')   || type.includes('roleChanged'))  return 'yellow';
  if (type.includes('deleted')   || type.includes('deactivated'))  return 'red';
  if (type.startsWith('user.')   || type.startsWith('token.'))     return 'purple';
  return 'gray';
}
