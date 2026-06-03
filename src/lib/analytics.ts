import type { RunStats, Run } from '../types';
import { computeStats } from './compute';

export interface PhaseRatios {
  start: number;  // Start→H1 / total
  race: number;   // H1→Hn / total
  finish: number; // Hn→Finish / total
}

export interface RunAnalytics {
  phaseRatios: PhaseRatios | null;
  fatigueIndex: number | null;
  rhythmScore: number | null;
  velocityFadeSlope: number | null;
  halfSplitAvg: { first: number; second: number } | null;
  peakSegmentLabel: string | null;
  segmentRatios: { label: string; ratio: number }[];
}

export interface TrendPoint {
  date: string;
  runName: string;
  totalTime: number | null;
  fatigueIndex: number | null;
  rhythmScore: number | null;
  consistency: number | null;
  hurdleSplits: Record<string, number>;
}

function linearRegressionSlope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((a, b) => a + b, 0) / n;
  const num   = values.reduce((sum, v, i) => sum + (i - meanX) * (v - meanY), 0);
  const den   = values.reduce((sum, _, i) => sum + (i - meanX) ** 2, 0);
  return den === 0 ? 0 : num / den;
}

export function computePhaseRatios(stats: RunStats): PhaseRatios | null {
  if (!stats.totalTime || stats.splits.length < 2) return null;
  const startSplit  = stats.splits[0];
  const finishSplit = stats.splits[stats.splits.length - 1];
  const raceSplits  = stats.splits.slice(1, -1);
  const raceTime    = raceSplits.reduce((sum, s) => sum + s.duration, 0);
  const total = stats.totalTime;
  return {
    start:  startSplit.duration / total,
    race:   raceTime / total,
    finish: finishSplit.duration / total,
  };
}

export function computeFatigueIndex(stats: RunStats): number | null {
  const splits = stats.interHurdleSplits;
  if (splits.length < 6) return null;
  const half     = Math.floor(splits.length / 2);
  const firstAvg = splits.slice(0, half).reduce((a, b) => a + b, 0) / half;
  const lastAvg  = splits.slice(-half).reduce((a, b) => a + b, 0) / half;
  return firstAvg === 0 ? null : lastAvg / firstAvg;
}

export function computeRhythmScore(stats: RunStats): number | null {
  const splits = stats.interHurdleSplits;
  if (splits.length < 2 || stats.consistency === null) return null;
  const mean = splits.reduce((a, b) => a + b, 0) / splits.length;
  if (mean === 0) return null;
  const cv = stats.consistency / mean;
  return Math.max(0, Math.min(100, 100 - cv * 100));
}

export function computeVelocityFadeSlope(stats: RunStats): number | null {
  if (stats.interHurdleSplits.length < 3) return null;
  return linearRegressionSlope(stats.interHurdleSplits);
}

export function computeAnalytics(stats: RunStats): RunAnalytics {
  const splits = stats.interHurdleSplits;
  const half   = Math.floor(splits.length / 2);
  const interSplits = stats.splits.filter(s => s.isInterHurdle);

  return {
    phaseRatios:       computePhaseRatios(stats),
    fatigueIndex:      computeFatigueIndex(stats),
    rhythmScore:       computeRhythmScore(stats),
    velocityFadeSlope: computeVelocityFadeSlope(stats),
    halfSplitAvg: splits.length >= 4
      ? {
          first:  splits.slice(0, half).reduce((a, b) => a + b, 0) / half,
          second: splits.slice(-half).reduce((a, b) => a + b, 0) / half,
        }
      : null,
    peakSegmentLabel: interSplits.length > 0
      ? interSplits.reduce((best, s) => s.duration < best.duration ? s : best, interSplits[0]).label
      : null,
    segmentRatios: stats.totalTime
      ? stats.splits.map(s => ({ label: s.label, ratio: s.duration / stats.totalTime! }))
      : [],
  };
}

export function computeTrends(runs: Run[]): TrendPoint[] {
  return [...runs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(run => {
      const stats = computeStats(run);
      const hurdleSplits: Record<string, number> = {};
      stats.splits.filter(s => s.isInterHurdle).forEach(s => {
        hurdleSplits[s.label] = s.duration;
      });
      return {
        date:         run.date,
        runName:      run.name,
        totalTime:    stats.totalTime,
        fatigueIndex: computeFatigueIndex(stats),
        rhythmScore:  computeRhythmScore(stats),
        consistency:  stats.consistency,
        hurdleSplits,
      };
    });
}
