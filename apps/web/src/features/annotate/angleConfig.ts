import type { NormalizedLandmark, PoseAngles } from './usePose';

export type HurdlePhase = 'approach' | 'clearance' | 'descent' | 'running';

export interface PhaseRange { min: number; max: number; }

export interface AnglePhaseConfig {
  labelKey: string;
  noteKey: string;
  phases: Record<HurdlePhase, PhaseRange>;
}

export interface KneePhaseConfig extends AnglePhaseConfig {
  clearanceLead: PhaseRange;
  clearanceTrail: PhaseRange;
}

export const TORSO_CONFIG: AnglePhaseConfig = {
  labelKey: 'pose.torsoLean',
  noteKey: 'pose.note.torsoLean',
  phases: {
    approach:  { min: 5,  max: 15 },
    clearance: { min: 18, max: 35 },
    descent:   { min: 5,  max: 20 },
    running:   { min: 5,  max: 15 },
  },
};

export const KNEE_CONFIG: KneePhaseConfig = {
  labelKey: 'pose.knee',
  noteKey: 'pose.note.knee',
  phases: {
    approach:  { min: 90,  max: 165 },
    clearance: { min: 55,  max: 160 },
    descent:   { min: 120, max: 170 },
    running:   { min: 90,  max: 165 },
  },
  clearanceLead:  { min: 110, max: 160 },
  clearanceTrail: { min: 55,  max: 110 },
};

export const ELBOW_CONFIG: AnglePhaseConfig = {
  labelKey: 'pose.elbow',
  noteKey: 'pose.note.elbow',
  phases: {
    approach:  { min: 80, max: 110 },
    clearance: { min: 70, max: 115 },
    descent:   { min: 80, max: 110 },
    running:   { min: 80, max: 110 },
  },
};

export function rangeLabel(range: PhaseRange): string {
  return `${range.min}–${range.max}°`;
}

export type BadgeStatus = 'ok' | 'low' | 'high';

export function evaluateAngle(value: number, range: PhaseRange): BadgeStatus {
  if (value < range.min) return 'low';
  if (value > range.max) return 'high';
  return 'ok';
}

export function detectHurdlePhase(lm: NormalizedLandmark[], angles: PoseAngles): HurdlePhase {
  const { torsoLean, leftKneeAngle, rightKneeAngle } = angles;
  const minKnee = Math.min(leftKneeAngle, rightKneeAngle);
  const maxKnee = Math.max(leftKneeAngle, rightKneeAngle);
  const kneeDiff = maxKnee - minKnee;

  const leftAnkleY  = lm[27]?.y ?? 1;
  const rightAnkleY = lm[28]?.y ?? 1;
  const minAnkleY   = Math.min(leftAnkleY, rightAnkleY);
  const hipY        = (lm[23].y + lm[24].y) / 2;
  const footElevated = minAnkleY < hipY - 0.1;

  // CLEARANCE in flight: most reliable — one foot clearly above hip in frame
  if (footElevated && torsoLean > 18 && minKnee < 115) return 'clearance';
  // CLEARANCE without foot signal: require very extreme lean (>30°) + very tucked trail leg
  // High threshold prevents false-positives during sprint high-knee-drive
  if (torsoLean > 30 && minKnee < 85 && kneeDiff > 45) return 'clearance';

  // DESCENT: landing leg very extended (>155°) + large knee asymmetry + torso already upright
  // Catches: right knee 168°, left knee 99°, torso 10° → landing after hurdle
  if (maxKnee > 155 && kneeDiff > 40 && torsoLean < 20) return 'descent';
  // DESCENT with foot still elevated but lean recovered
  if (footElevated && torsoLean < 18) return 'descent';

  // APPROACH: forward lean toward hurdle, asymmetric stride
  if (torsoLean > 13 && kneeDiff > 20) return 'approach';
  if (torsoLean > 18) return 'approach';

  return 'running';
}
