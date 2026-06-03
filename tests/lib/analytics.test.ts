import { describe, it, expect } from 'vitest';
import {
  computeAnalytics,
  computePhaseRatios,
  computeFatigueIndex,
  computeRhythmScore,
  computeVelocityFadeSlope,
  computeTrends,
} from '../../src/lib/analytics';
import { computeStats } from '../../src/lib/compute';
import type { Run } from '../../src/types';

function makeRun(times: number[], id = '1'): Run {
  const events = [
    { type: 'start' as const, videoTime: 0 },
    ...times.map((t, i) => ({ type: 'hurdle' as const, hurdleIndex: i + 1, videoTime: t })),
    { type: 'finish' as const, videoTime: times[times.length - 1] + 2.5 },
  ];
  return { id, name: `Run ${id}`, date: '2026-06-01', discipline: '110m-hurdles' as const,
           hurdleCount: times.length, events, notes: '', createdAt: 0 };
}

// Even rhythm: each hurdle at exactly 1.30s apart
const evenRun  = makeRun([2.75, 4.05, 5.35, 6.65, 7.95, 9.25, 10.55, 11.85, 13.15, 14.45]);
// Fading run:  last hurdles slower
const fadeRun  = makeRun([2.75, 4.05, 5.38, 6.74, 8.15, 9.62, 11.15, 12.74, 14.39, 16.10]);

describe('computePhaseRatios', () => {
  it('returns ratios that sum to 1', () => {
    const stats = computeStats(evenRun);
    const ratios = computePhaseRatios(stats);
    expect(ratios!.start + ratios!.race + ratios!.finish).toBeCloseTo(1, 5);
  });
  it('returns null when total time is null', () => {
    const emptyStats = computeStats({ ...evenRun, events: [] });
    expect(computePhaseRatios(emptyStats)).toBeNull();
  });
});

describe('computeFatigueIndex', () => {
  it('returns ~1.0 for even run', () => {
    const stats = computeStats(evenRun);
    const idx = computeFatigueIndex(stats);
    expect(idx).not.toBeNull();
    expect(Math.abs(idx! - 1.0)).toBeLessThan(0.01);
  });
  it('returns >1 for fading run', () => {
    const stats = computeStats(fadeRun);
    const idx = computeFatigueIndex(stats);
    expect(idx).not.toBeNull();
    expect(idx!).toBeGreaterThan(1.05);
  });
  it('returns null when fewer than 6 inter-hurdle splits', () => {
    const shortRun = makeRun([2.75, 4.05, 5.35]);
    const stats = computeStats(shortRun);
    expect(computeFatigueIndex(stats)).toBeNull();
  });
});

describe('computeRhythmScore', () => {
  it('returns near 100 for even run', () => {
    const stats = computeStats(evenRun);
    expect(computeRhythmScore(stats)!).toBeGreaterThan(95);
  });
  it('returns lower score for uneven run', () => {
    const stats = computeStats(fadeRun);
    expect(computeRhythmScore(stats)!).toBeLessThan(computeRhythmScore(computeStats(evenRun))!);
  });
});

describe('computeVelocityFadeSlope', () => {
  it('returns ~0 for even run', () => {
    const stats = computeStats(evenRun);
    expect(Math.abs(computeVelocityFadeSlope(stats)!)).toBeLessThan(0.01);
  });
  it('returns positive value (slowing) for fade run', () => {
    const stats = computeStats(fadeRun);
    expect(computeVelocityFadeSlope(stats)!).toBeGreaterThan(0.01);
  });
});

describe('computeTrends', () => {
  it('returns one data point per run, sorted by date', () => {
    const runsData = [
      { run: makeRun([2.80, 4.12, 5.45, 6.78, 8.11, 9.44, 10.77, 12.10, 13.43, 14.76], 'a'), date: '2026-05-01' },
      { run: makeRun([2.75, 4.05, 5.35, 6.65, 7.95, 9.25, 10.55, 11.85, 13.15, 14.45], 'b'), date: '2026-05-15' },
    ].map(({ run, date }) => ({ ...run, date }));
    const trends = computeTrends(runsData);
    expect(trends).toHaveLength(2);
    expect(trends[0].date).toBe('2026-05-01');
    expect(trends[0].totalTime).toBeDefined();
    expect(trends[0].fatigueIndex).toBeDefined();
    expect(trends[0].rhythmScore).toBeDefined();
  });
});
