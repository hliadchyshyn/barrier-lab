import { create } from 'zustand';
import { db } from '../db';
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

export const useRunsStore = create<RunsStore>((set) => ({
  runs: [],
  loaded: false,
  compareIds: [null, null],

  loadAll: async () => {
    const runs = await db.runs.orderBy('createdAt').reverse().toArray();
    set({ runs, loaded: true });
  },

  addRun: async (run) => {
    await db.runs.put(run);
    set(s => ({ runs: [run, ...s.runs] }));
  },

  updateRun: async (id, updates) => {
    await db.runs.update(id, updates);
    set(s => ({
      runs: s.runs.map(r => r.id === id ? { ...r, ...updates } : r),
    }));
  },

  deleteRun: async (id) => {
    await db.runs.delete(id);
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
