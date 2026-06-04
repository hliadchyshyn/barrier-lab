import { useRef, useState, useCallback } from 'react';
import { detectHurdlePhase, type HurdlePhase } from './angleConfig';

export type { HurdlePhase };

export interface PoseAngles {
  torsoLean: number;
  rightKneeAngle: number;
  leftKneeAngle: number;
  rightElbowAngle: number;
  leftElbowAngle: number;
}

export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface FrameAnalysis {
  time: number;
  angles: PoseAngles;
  phase: HurdlePhase;
  rawPhase: HurdlePhase;
  landmarks: NormalizedLandmark[];
}

function angle3(a: NormalizedLandmark, b: NormalizedLandmark, c: NormalizedLandmark): number {
  const v1 = { x: a.x - b.x, y: a.y - b.y };
  const v2 = { x: c.x - b.x, y: c.y - b.y };
  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag = Math.sqrt((v1.x ** 2 + v1.y ** 2) * (v2.x ** 2 + v2.y ** 2));
  if (mag === 0) return 0;
  return Math.acos(Math.max(-1, Math.min(1, dot / mag))) * (180 / Math.PI);
}

function torsoLean(lm: NormalizedLandmark[]): number {
  const hipX = (lm[23].x + lm[24].x) / 2;
  const hipY = (lm[23].y + lm[24].y) / 2;
  const shX  = (lm[11].x + lm[12].x) / 2;
  const shY  = (lm[11].y + lm[12].y) / 2;
  const dx = shX - hipX;
  const dy = hipY - shY;
  return Math.atan2(Math.abs(dx), dy) * (180 / Math.PI);
}

function computeAngles(pts: NormalizedLandmark[]): PoseAngles {
  return {
    torsoLean: torsoLean(pts),
    rightKneeAngle: angle3(pts[24], pts[26], pts[28]),
    leftKneeAngle:  angle3(pts[23], pts[25], pts[27]),
    rightElbowAngle: angle3(pts[12], pts[14], pts[16]),
    leftElbowAngle:  angle3(pts[11], pts[13], pts[15]),
  };
}

function seekTo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    const handler = () => {
      video.removeEventListener('seeked', handler);
      resolve();
    };
    video.addEventListener('seeked', handler);
    video.currentTime = time;
  });
}

// Smooth detected phases using a sliding window majority vote
function applyTemporalSmoothing(frames: FrameAnalysis[]): FrameAnalysis[] {
  const HALF_WINDOW = 2; // ±2 frames = 5-frame window at 0.12s/frame ≈ 0.6s
  return frames.map((frame, i) => {
    const start = Math.max(0, i - HALF_WINDOW);
    const end = Math.min(frames.length, i + HALF_WINDOW + 1);
    const counts: Record<HurdlePhase, number> = {
      approach: 0, clearance: 0, descent: 0, running: 0,
    };
    for (let j = start; j < end; j++) counts[frames[j].rawPhase]++;
    const dominantPhase = (Object.entries(counts) as [HurdlePhase, number][])
      .sort((a, b) => b[1] - a[1])[0][0];
    return { ...frame, phase: dominantPhase };
  });
}

// Find the closest analyzed frame to a given time
export function frameAtTime(frames: FrameAnalysis[], time: number): FrameAnalysis | null {
  if (frames.length === 0) return null;
  let closest = frames[0];
  let minDiff = Math.abs(frames[0].time - time);
  for (const f of frames) {
    const diff = Math.abs(f.time - time);
    if (diff < minDiff) { minDiff = diff; closest = f; }
  }
  // Only return if within 0.3s of a known frame
  return minDiff < 0.3 ? closest : null;
}

const ANALYSIS_INTERVAL = 0.12; // analyze a frame every 120ms

export function usePose() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const landmarkerRef = useRef<any>(null);
  const allLandmarksRef = useRef<NormalizedLandmark[][] | null>(null);
  const cancelAnalysisRef = useRef(false);

  const [loading, setLoading] = useState(false);
  const [allLandmarks, setAllLandmarks] = useState<NormalizedLandmark[][] | null>(null);
  const [selectedPoseIdx, setSelectedPoseIdx] = useState(0);
  const [angles, setAngles] = useState<PoseAngles | null>(null);
  const [phase, setPhase] = useState<HurdlePhase | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [videoFrames, setVideoFrames] = useState<FrameAnalysis[]>([]);
  const [isAnalyzingVideo, setIsAnalyzingVideo] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  const landmarks = allLandmarks?.[selectedPoseIdx] ?? null;

  const ensureLoaded = useCallback(async () => {
    if (landmarkerRef.current) return landmarkerRef.current;
    setLoading(true);
    setError(null);
    try {
      const { PoseLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm',
      );
      landmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'CPU',
        },
        runningMode: 'IMAGE',
        numPoses: 8,
      });
      return landmarkerRef.current;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load pose model');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const detectOnFrame = useCallback(async (video: HTMLVideoElement) => {
    const lm = await ensureLoaded();
    if (!lm) return;
    try {
      const result = lm.detect(video);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allPts: NormalizedLandmark[][] = (result.landmarks as any[]).filter(
        (pts: NormalizedLandmark[]) => pts && pts.length >= 29,
      );
      if (allPts.length === 0) {
        allLandmarksRef.current = null;
        setAllLandmarks(null);
        setAngles(null);
        setPhase(null);
        setError('No pose detected in frame');
        return;
      }
      allLandmarksRef.current = allPts;
      setError(null);
      setAllLandmarks(allPts);
      setSelectedPoseIdx(0);
      const computed = computeAngles(allPts[0]);
      setAngles(computed);
      setPhase(detectHurdlePhase(allPts[0], computed));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Detection failed');
    }
  }, [ensureLoaded]);

  const analyzeVideo = useCallback(async (video: HTMLVideoElement) => {
    const lm = await ensureLoaded();
    if (!lm) return;

    const duration = video.duration;
    if (!duration || !isFinite(duration)) return;

    cancelAnalysisRef.current = false;
    setIsAnalyzingVideo(true);
    setAnalysisProgress(0);
    setVideoFrames([]);

    const times: number[] = [];
    for (let t = 0; t < duration; t += ANALYSIS_INTERVAL) {
      times.push(parseFloat(t.toFixed(3)));
    }

    const rawFrames: FrameAnalysis[] = [];

    // Save playback state
    const wasPlaying = !video.paused;
    if (wasPlaying) video.pause();
    const savedTime = video.currentTime;

    try {
      for (let i = 0; i < times.length; i++) {
        if (cancelAnalysisRef.current) break;

        await seekTo(video, times[i]);

        try {
          const result = lm.detect(video);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const allPts: NormalizedLandmark[][] = (result.landmarks as any[]).filter(
            (pts: NormalizedLandmark[]) => pts && pts.length >= 29,
          );
          if (allPts.length > 0) {
            const pts = allPts[0];
            const computed = computeAngles(pts);
            const rawPhase = detectHurdlePhase(pts, computed);
            rawFrames.push({
              time: times[i],
              angles: computed,
              phase: rawPhase,
              rawPhase,
              landmarks: pts,
            });
          }
        } catch { /* skip undetectable frame */ }

        setAnalysisProgress((i + 1) / times.length);
      }
    } finally {
      // Restore video state
      await seekTo(video, savedTime);
      if (wasPlaying) video.play().catch(() => undefined);
      setIsAnalyzingVideo(false);
    }

    if (rawFrames.length === 0) {
      setError('No poses detected in video');
      return;
    }

    const smoothed = applyTemporalSmoothing(rawFrames);
    setVideoFrames(smoothed);
  }, [ensureLoaded]);

  const cancelAnalysis = useCallback(() => {
    cancelAnalysisRef.current = true;
  }, []);

  const selectPose = useCallback((idx: number) => {
    const pts = allLandmarksRef.current?.[idx];
    setSelectedPoseIdx(idx);
    if (pts) {
      const computed = computeAngles(pts);
      setAngles(computed);
      setPhase(detectHurdlePhase(pts, computed));
    } else {
      setAngles(null);
      setPhase(null);
    }
  }, []);

  const clearPose = useCallback(() => {
    allLandmarksRef.current = null;
    setAllLandmarks(null);
    setAngles(null);
    setPhase(null);
    setSelectedPoseIdx(0);
    setError(null);
  }, []);

  return {
    detectOnFrame,
    analyzeVideo,
    cancelAnalysis,
    clearPose,
    selectPose,
    loading,
    allLandmarks,
    landmarks,
    selectedPoseIdx,
    angles,
    phase,
    videoFrames,
    isAnalyzingVideo,
    analysisProgress,
    error,
  };
}
