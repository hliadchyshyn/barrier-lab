import { useRef, useState, useCallback } from 'react';

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

export function usePose() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const landmarkerRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const [landmarks, setLandmarks] = useState<NormalizedLandmark[] | null>(null);
  const [angles, setAngles] = useState<PoseAngles | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        numPoses: 1,
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
      const pts: NormalizedLandmark[] = result.landmarks[0];
      if (!pts || pts.length < 29) {
        setLandmarks(null);
        setAngles(null);
        setError('No pose detected in frame');
        return;
      }
      setError(null);
      setLandmarks(pts);
      setAngles({
        torsoLean: torsoLean(pts),
        rightKneeAngle: angle3(pts[24], pts[26], pts[28]),
        leftKneeAngle:  angle3(pts[23], pts[25], pts[27]),
        rightElbowAngle: angle3(pts[12], pts[14], pts[16]),
        leftElbowAngle:  angle3(pts[11], pts[13], pts[15]),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Detection failed');
    }
  }, [ensureLoaded]);

  const clearPose = useCallback(() => {
    setLandmarks(null);
    setAngles(null);
    setError(null);
  }, []);

  return { detectOnFrame, clearPose, loading, landmarks, angles, error };
}
