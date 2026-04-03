import { Response } from 'express';
import { randomUUID } from 'crypto';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SSEActor {
  id: string;
  email?: string;
  role?: string;
}

export interface SSEEventMeta {
  method?: string;
  path?: string;
  statusCode?: number;
  durationMs?: number;
}

export interface SSEEvent {
  id: string;
  type: string;
  timestamp: string;
  actor: SSEActor | 'system';
  payload: Record<string, unknown>;
  meta?: SSEEventMeta;
}

// Partial input — id and timestamp are auto-generated if omitted
export type EmitInput = Omit<SSEEvent, 'id' | 'timestamp'> & {
  id?: string;
  timestamp?: string;
};

// ── Live Service (singleton) ──────────────────────────────────────────────────

class LiveService {
  private readonly clients: Set<Response> = new Set();

  /** Register an SSE client (Response object). */
  subscribe(res: Response): void {
    this.clients.add(res);
  }

  /** Remove an SSE client on disconnect. */
  unsubscribe(res: Response): void {
    this.clients.delete(res);
  }

  /** Broadcast an event to all connected SSE clients. */
  emit(input: EmitInput): void {
    const event: SSEEvent = {
      id:        input.id        ?? randomUUID(),
      timestamp: input.timestamp ?? new Date().toISOString(),
      type:      input.type,
      actor:     input.actor,
      payload:   input.payload,
      ...(input.meta ? { meta: input.meta } : {}),
    };

    const frame = `data: ${JSON.stringify(event)}\n\n`;

    for (const client of this.clients) {
      try {
        client.write(frame);
      } catch {
        // Client already closed — clean up
        this.clients.delete(client);
      }
    }
  }

  get clientCount(): number {
    return this.clients.size;
  }
}

export const liveService = new LiveService();
