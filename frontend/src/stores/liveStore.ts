'use client';

import { create } from 'zustand';
import type { LiveEvent, EventTypeName } from '@/types/events.types';

const MAX_EVENTS = 200;

interface LiveState {
  events:       LiveEvent[];
  isPaused:     boolean;
  activeFilter: EventTypeName | null;
  selectedEvent: LiveEvent | null;
  // Live stats counters (derived from events)
  errorCount:   number;
  totalCount:   number;
}

interface LiveActions {
  pushEvent:       (event: LiveEvent) => void;
  setPaused:       (paused: boolean) => void;
  setFilter:       (filter: EventTypeName | null) => void;
  selectEvent:     (event: LiveEvent | null) => void;
  clearEvents:     () => void;
  filteredEvents:  () => LiveEvent[];
}

export const useLiveStore = create<LiveState & LiveActions>((set, get) => ({
  // ── State ──────────────────────────────────────────────────────────────────
  events:        [],
  isPaused:      false,
  activeFilter:  null,
  selectedEvent: null,
  errorCount:    0,
  totalCount:    0,

  // ── Actions ────────────────────────────────────────────────────────────────
  pushEvent: (event) => {
    if (get().isPaused) return;

    const isError = event.type === 'api.error';

    set((state) => {
      const next = [event, ...state.events].slice(0, MAX_EVENTS);
      return {
        events:     next,
        totalCount: state.totalCount + 1,
        errorCount: state.errorCount + (isError ? 1 : 0),
      };
    });
  },

  setPaused:   (paused)  => set({ isPaused: paused }),
  setFilter:   (filter)  => set({ activeFilter: filter }),
  selectEvent: (event)   => set({ selectedEvent: event }),

  clearEvents: () => set({ events: [], errorCount: 0, totalCount: 0, selectedEvent: null }),

  filteredEvents: () => {
    const { events, activeFilter } = get();
    if (!activeFilter) return events;
    return events.filter((e) => e.type === activeFilter);
  },
}));
