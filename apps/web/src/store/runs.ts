import { create } from 'zustand';
import { db } from '../db';
import { deleteVideo } from '../lib/videoStorage';
import { api } from '../lib/apiClient';
import type { Run } from '../types';

interface RunsStore {
  runs: Run[];
  loaded: boolean;
  loadAll: () => Promise<void>;
  addRun: (run: Run) => Promise<void>;
  updateRun: (id: string, updates: Partial<Run>) => Promise<void>;
  deleteRun: (id: string) => Promise<void>;
  compareIds: [string | null, string | null];
  setCompareId: (slot: 0 | 1, id: string | null) => void;
}

function toRun(row: Record<string, unknown>): Run {
  return {
    id:          row.id as string,
    name:        row.name as string,
    date:        row.date as string,
    discipline:  row.discipline as Run['discipline'],
    hurdleCount: row.hurdleCount as number,
    events:      (row.events ?? []) as Run['events'],
    notes:       (row.notes ?? '') as string,
    createdAt:   typeof row.createdAt === 'string'
                   ? new Date(row.createdAt).getTime()
                   : row.createdAt as number,
  };
}

export const useRunsStore = create<RunsStore>((set) => ({
  runs: [],
  loaded: false,
  compareIds: [null, null],

  loadAll: async () => {
    try {
      const rows = await api.get<Record<string, unknown>[]>('/api/runs');
      const runs = rows.map(toRun);
      await db.runs.clear();
      await db.runs.bulkPut(runs);
      set({ runs, loaded: true });
    } catch {
      // Offline fallback: serve from Dexie cache
      const runs = await db.runs.orderBy('createdAt').reverse().toArray();
      set({ runs, loaded: true });
    }
  },

  addRun: async (run) => {
    const row = await api.post<Record<string, unknown>>('/api/runs', run);
    const saved = toRun(row);
    await db.runs.put(saved);
    set(s => ({ runs: [saved, ...s.runs] }));
  },

  updateRun: async (id, updates) => {
    const row = await api.patch<Record<string, unknown>>(`/api/runs/${id}`, updates);
    const saved = toRun(row);
    await db.runs.update(id, updates);
    set(s => ({ runs: s.runs.map(r => r.id === id ? saved : r) }));
  },

  deleteRun: async (id) => {
    await Promise.all([
      api.delete(`/api/runs/${id}`),
      db.runs.delete(id),
      deleteVideo(id),
      api.delete(`/api/runs/${id}/video`).catch(() => {}),
    ]);
    set(s => ({ runs: s.runs.filter(r => r.id !== id) }));
  },

  setCompareId: (slot, id) => {
    set(s => {
      const ids: [string | null, string | null] = [...s.compareIds] as [string | null, string | null];
      ids[slot] = id;
      return { compareIds: ids };
    });
  },
}));
