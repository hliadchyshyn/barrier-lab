export type Discipline = '60m-hurdles' | '100m-hurdles' | '110m-hurdles' | '400m-hurdles' | 'custom';

export const DISCIPLINE_PRESETS: Record<Discipline, { label: string; hurdleCount: number }> = {
  '60m-hurdles':  { label: '60m Hurdles',  hurdleCount: 5  },
  '100m-hurdles': { label: '100m Hurdles', hurdleCount: 10 },
  '110m-hurdles': { label: '110m Hurdles', hurdleCount: 10 },
  '400m-hurdles': { label: '400m Hurdles', hurdleCount: 10 },
  'custom':       { label: 'Custom',        hurdleCount: 10 },
};

export type EventType = 'start' | 'hurdle' | 'finish';

export interface HurdleEvent {
  type: EventType;
  hurdleIndex?: number; // 1-based, only for type === 'hurdle'
  videoTime: number;    // seconds from video start
}

export interface Run {
  id: string;
  name: string;
  date: string;           // ISO date string
  discipline: Discipline;
  hurdleCount: number;
  events: HurdleEvent[];
  notes: string;
  createdAt: number;      // timestamp
}

export interface SplitStat {
  label: string;          // 'Start→H1', 'H1→H2', 'H10→Finish'
  duration: number;       // seconds
  isInterHurdle: boolean; // true for H→H splits only
  isPB?: boolean;
}

export interface RunStats {
  totalTime: number | null;
  splits: SplitStat[];
  interHurdleSplits: number[];     // seconds, only H→H
  consistency: number | null;      // STD of interHurdleSplits
  bestHurdleIndex: number | null;  // 1-based
  worstHurdleIndex: number | null; // 1-based
}

export interface SplitDelta {
  label: string;
  durationA: number | null;
  durationB: number | null;
  delta: number | null; // B - A, negative = B faster
}
