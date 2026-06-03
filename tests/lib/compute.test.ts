import { describe, it, expect } from 'vitest';
import { computeStats, computeDelta, formatTime, stdDev } from '../../src/lib/compute';
import type { HurdleEvent, Run } from '../../src/types';

const events: HurdleEvent[] = [
  { type: 'start',  videoTime: 0.00 },
  { type: 'hurdle', hurdleIndex: 1, videoTime: 2.75 },
  { type: 'hurdle', hurdleIndex: 2, videoTime: 4.10 },
  { type: 'hurdle', hurdleIndex: 3, videoTime: 5.42 },
  { type: 'finish', videoTime: 13.75 },
];

const makeRun = (evts: HurdleEvent[]): Run => ({
  id: '1', name: 'Test', date: '2026-06-01',
  discipline: '110m-hurdles', hurdleCount: 3,
  events: evts, notes: '', createdAt: 0,
});

describe('computeStats', () => {
  it('calculates total time', () => {
    const stats = computeStats(makeRun(events));
    expect(stats.totalTime).toBeCloseTo(13.75);
  });

  it('calculates splits correctly', () => {
    const stats = computeStats(makeRun(events));
    expect(stats.splits[0].label).toBe('Start→H1');
    expect(stats.splits[0].duration).toBeCloseTo(2.75);
    expect(stats.splits[1].label).toBe('H1→H2');
    expect(stats.splits[1].duration).toBeCloseTo(1.35);
    expect(stats.splits[3].label).toBe('H3→Finish');
    expect(stats.splits[3].duration).toBeCloseTo(8.33);
  });

  it('identifies inter-hurdle splits', () => {
    const stats = computeStats(makeRun(events));
    const inter = stats.splits.filter(s => s.isInterHurdle);
    expect(inter).toHaveLength(2); // H1→H2, H2→H3
  });

  it('returns null stats when events are incomplete', () => {
    const stats = computeStats(makeRun([{ type: 'start', videoTime: 0 }]));
    expect(stats.totalTime).toBeNull();
  });

  it('finds best and worst hurdle by inter-hurdle split', () => {
    const stats = computeStats(makeRun(events));
    // H1→H2 = 1.35, H2→H3 = 1.32 → best is H2→H3 (index 2), worst is H1→H2 (index 1)
    expect(stats.bestHurdleIndex).toBe(2);
    expect(stats.worstHurdleIndex).toBe(1);
  });
});

describe('computeDelta', () => {
  it('computes delta between two stat sets', () => {
    const a = computeStats(makeRun(events));
    const b = computeStats(makeRun([
      { type: 'start', videoTime: 0 },
      { type: 'hurdle', hurdleIndex: 1, videoTime: 2.80 },
      { type: 'hurdle', hurdleIndex: 2, videoTime: 4.05 },
      { type: 'hurdle', hurdleIndex: 3, videoTime: 5.30 },
      { type: 'finish', videoTime: 13.60 },
    ]));
    const delta = computeDelta(a, b);
    expect(delta[0].delta).toBeCloseTo(0.05);  // B Start→H1 is 0.05s slower
    expect(delta[1].delta).toBeCloseTo(-0.10); // B H1→H2 is 0.10s faster
  });
});

describe('formatTime', () => {
  it('formats sub-minute times as SS.mm', () => {
    expect(formatTime(13.75)).toBe('13.75');
  });
  it('formats over-minute times as M:SS.mm', () => {
    expect(formatTime(63.45)).toBe('1:03.45');
  });
});

describe('stdDev', () => {
  it('calculates standard deviation', () => {
    expect(stdDev([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.0);
  });
  it('returns 0 for single value', () => {
    expect(stdDev([5])).toBe(0);
  });
});
