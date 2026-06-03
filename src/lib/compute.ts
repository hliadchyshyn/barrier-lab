import type { Run, HurdleEvent, RunStats, SplitStat, SplitDelta } from '../types';

export function formatTime(seconds: number): string {
  if (seconds < 60) return seconds.toFixed(2);
  const m = Math.floor(seconds / 60);
  const s = (seconds % 60).toFixed(2).padStart(5, '0');
  return `${m}:${s}`;
}

export function stdDev(values: number[]): number {
  if (values.length <= 1) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function sortedEvents(run: Run): HurdleEvent[] {
  return [...run.events].sort((a, b) => a.videoTime - b.videoTime);
}

export function computeStats(run: Run): RunStats {
  const sorted = sortedEvents(run);
  const start  = sorted.find(e => e.type === 'start');
  const finish = sorted.find(e => e.type === 'finish');
  const hurdles = sorted
    .filter(e => e.type === 'hurdle')
    .sort((a, b) => (a.hurdleIndex ?? 0) - (b.hurdleIndex ?? 0));

  if (!start) {
    return { totalTime: null, splits: [], interHurdleSplits: [], consistency: null, bestHurdleIndex: null, worstHurdleIndex: null };
  }

  const ordered: HurdleEvent[] = [start, ...hurdles, ...(finish ? [finish] : [])];
  const splits: SplitStat[] = [];

  for (let i = 0; i < ordered.length - 1; i++) {
    const from = ordered[i];
    const to   = ordered[i + 1];
    const fromLabel = from.type === 'start' ? 'Start' : `H${from.hurdleIndex}`;
    const toLabel   = to.type === 'finish'  ? 'Finish' : `H${to.hurdleIndex}`;
    splits.push({
      label: `${fromLabel}→${toLabel}`,
      duration: to.videoTime - from.videoTime,
      isInterHurdle: from.type === 'hurdle' && to.type === 'hurdle',
    });
  }

  const interHurdleSplits = splits.filter(s => s.isInterHurdle).map(s => s.duration);
  const consistency = interHurdleSplits.length >= 2 ? stdDev(interHurdleSplits) : null;

  let bestHurdleIndex: number | null = null;
  let worstHurdleIndex: number | null = null;

  if (interHurdleSplits.length > 0) {
    const interSplits = splits.filter(s => s.isInterHurdle);
    const fastest = Math.min(...interHurdleSplits);
    const slowest = Math.max(...interHurdleSplits);
    const fastIdx = interSplits.findIndex(s => s.duration === fastest);
    const slowIdx = interSplits.findIndex(s => s.duration === slowest);
    bestHurdleIndex  = hurdles[fastIdx]?.hurdleIndex ?? null;
    worstHurdleIndex = hurdles[slowIdx]?.hurdleIndex ?? null;
  }

  return {
    totalTime: finish ? finish.videoTime - start.videoTime : null,
    splits,
    interHurdleSplits,
    consistency,
    bestHurdleIndex,
    worstHurdleIndex,
  };
}

export function computeDelta(a: RunStats, b: RunStats): SplitDelta[] {
  const labels = new Set([...a.splits.map(s => s.label), ...b.splits.map(s => s.label)]);
  return [...labels].map(label => {
    const sa = a.splits.find(s => s.label === label);
    const sb = b.splits.find(s => s.label === label);
    return {
      label,
      durationA: sa?.duration ?? null,
      durationB: sb?.duration ?? null,
      delta: sa && sb ? sb.duration - sa.duration : null,
    };
  });
}
