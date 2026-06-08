import type { FrameAnalysis } from './usePose';

// Larger than a typical hurdle-crossing duration (~0.3s) but smaller than inter-hurdle gap (~0.9s+)
const GAP_THRESHOLD = 0.6;

// Peak = frame with max torso lean (approach/clearance lean is highest right at the hurdle)
function clusterPeak(cluster: FrameAnalysis[]): number {
  return cluster.reduce((best, f) =>
    f.angles.torsoLean > best.angles.torsoLean ? f : best,
  ).time;
}

function buildClusters(frames: FrameAnalysis[]): FrameAnalysis[][] {
  if (frames.length === 0) return [];
  const clusters: FrameAnalysis[][] = [];
  let current: FrameAnalysis[] = [frames[0]];
  for (let i = 1; i < frames.length; i++) {
    if (frames[i].time - frames[i - 1].time < GAP_THRESHOLD) {
      current.push(frames[i]);
    } else {
      clusters.push(current);
      current = [frames[i]];
    }
  }
  clusters.push(current);
  return clusters;
}

export function detectHurdlesFromFrames(
  frames: FrameAnalysis[],
  hurdleCount: number,
): number[] {
  // Use rawPhase (before temporal smoothing) — brief clearance events get voted away by the smoother.
  //
  // Signal priority:
  //  1. clearance + descent  → most precise (directly at/after the hurdle)
  //  2. all non-running      → fallback when clearance is never detected (common at 0.12s sampling)
  //
  // Approach frames ARE included in the fallback because clearance is rarely caught at 8fps;
  // the approach lean peak is a reliable proxy for the hurdle location (~0.2–0.4s early).
  const precise = frames.filter(
    f => f.rawPhase === 'clearance' || f.rawPhase === 'descent',
  );

  const signal = precise.length >= Math.ceil(hurdleCount / 2)
    ? precise
    : frames.filter(f => f.rawPhase !== 'running');

  return buildClusters(signal)
    .sort((a, b) => a[0].time - b[0].time)
    .slice(0, hurdleCount)
    .map(clusterPeak);
}
