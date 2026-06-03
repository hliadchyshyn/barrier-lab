import { useRef, useState, useCallback, useEffect } from 'react';

export function useSyncedVideos(offsetB: number = 0) {
  const refA = useRef<HTMLVideoElement>(null);
  const refB = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number | null>(null);
  const offsetBRef = useRef(offsetB);
  const [currentTime, setCurrentTime] = useState(0);
  const [durationA, setDurationA] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    offsetBRef.current = offsetB;
  }, [offsetB]);

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const startLoop = useCallback(() => {
    const loop = () => {
      const a = refA.current;
      const b = refB.current;
      if (a && b && !a.paused) {
        const target = a.currentTime + offsetBRef.current;
        if (Math.abs(b.currentTime - target) > 0.05) b.currentTime = target;
        setCurrentTime(a.currentTime);
        rafRef.current = requestAnimationFrame(loop);
      } else {
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  useEffect(() => {
    const a = refA.current;
    if (!a) return;
    const onMeta = () => setDurationA(a.duration);
    const onTime = () => setCurrentTime(a.currentTime);
    const onEnded = () => {
      stopLoop();
      setPlaying(false);
    };
    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('ended', onEnded);
    return () => {
      a.removeEventListener('loadedmetadata', onMeta);
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('ended', onEnded);
    };
  }, [stopLoop]);

  const seekTo = useCallback((time: number) => {
    const a = refA.current;
    const b = refB.current;
    if (!a) return;
    a.currentTime = Math.max(0, Math.min(time, a.duration || 0));
    if (b) b.currentTime = a.currentTime + offsetBRef.current;
    setCurrentTime(a.currentTime);
  }, []);

  const togglePlay = useCallback(() => {
    const a = refA.current;
    const b = refB.current;
    if (!a) return;
    if (a.paused) {
      if (b) {
        b.currentTime = a.currentTime + offsetBRef.current;
        b.play().catch((err: unknown) => {
          if (!(err instanceof Error && err.name === 'AbortError')) {
            stopLoop();
            setPlaying(false);
          }
        });
      }
      a.play().catch((err: unknown) => {
        if (!(err instanceof Error && err.name === 'AbortError')) {
          stopLoop();
          setPlaying(false);
        }
      });
      setPlaying(true);
      startLoop();
    } else {
      a.pause();
      if (b) b.pause();
      setPlaying(false);
      stopLoop();
    }
  }, [stopLoop, startLoop]);

  const changeRate = useCallback((rate: number) => {
    if (refA.current) refA.current.playbackRate = rate;
    if (refB.current) refB.current.playbackRate = rate;
    setPlaybackRate(rate);
  }, []);

  useEffect(() => () => stopLoop(), [stopLoop]);

  return { refA, refB, currentTime, durationA, playing, playbackRate, seekTo, togglePlay, changeRate };
}
