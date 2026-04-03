'use client';

import type { LiveEvent } from '@/types/events.types';

type EventHandler = (event: LiveEvent) => void;

class SSEManager {
  private source: EventSource | null = null;
  private retryDelay = 1000;
  private maxDelay   = 30_000;
  private handlers   = new Set<EventHandler>();
  private token: string | null = null;
  private stopped = false;

  /** Connect (or reconnect) the SSE stream. */
  connect(accessToken: string): void {
    this.token   = accessToken;
    this.stopped = false;
    this.openSource();
  }

  /** Close the SSE stream (e.g. on logout). */
  disconnect(): void {
    this.stopped = true;
    this.source?.close();
    this.source = null;
    this.retryDelay = 1000;
  }

  /** Subscribe to incoming events. Returns unsubscribe function. */
  subscribe(handler: EventHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  private openSource(): void {
    if (!this.token || typeof window === 'undefined') return;

    this.source?.close();

    const url = `${process.env.NEXT_PUBLIC_SSE_URL ?? 'http://localhost:3000/api/live/events'}?token=${encodeURIComponent(this.token)}`;
    this.source = new EventSource(url);

    this.source.onmessage = (e: MessageEvent) => {
      try {
        const event = JSON.parse(e.data as string) as LiveEvent;
        this.handlers.forEach((h) => h(event));
        // Reset backoff on successful message
        this.retryDelay = 1000;
      } catch {
        // Malformed JSON — ignore
      }
    };

    this.source.onerror = () => {
      this.source?.close();
      this.source = null;
      if (this.stopped) return;
      // Exponential backoff
      setTimeout(() => {
        if (!this.stopped) this.openSource();
      }, this.retryDelay);
      this.retryDelay = Math.min(this.retryDelay * 2, this.maxDelay);
    };
  }
}

export const sseManager = new SSEManager();
