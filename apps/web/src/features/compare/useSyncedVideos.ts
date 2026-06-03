import { useRef, useState, useCallback, useEffect } from 'react';

export function useSyncedVideos(offsetB = 0) {
  const refA = useRef<HTMLVideoElement>(null);
  const refB = useRef<HTMLVideoElement>(null);
  const rafRef = useRef(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [durationA, setDurationA] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    const a = refA.current;
    if (!a) return;
    const onMeta = () => setDurationA(a.duration);
    const onTime = () => setCurrentTime(a.currentTime);
    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('timeupdate', onTime);
    return () => {
      a.removeEventListener('loadedmetadata', onMeta);
      a.removeEventListener('timeupdate', onTime);
    };
  }, []);

  const stopLoop = useCallback(() => cancelAnimationFrame(rafRef.current), []);

  const startLoop = useCallback(() => {
    const loop = () => {
      const a = refA.current;
      const b = refB.current;
      if (a && b && !a.paused) {
        const target = a.currentTime + offsetB;
        if (Math.abs(b.currentTime - target) > 0.05) b.currentTime = target;
        setCurrentTime(a.currentTime);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [offsetB]);

  const seekTo = useCallback((time: number) => {
    const a = refA.current;
    const b = refB.current;
    if (!a) return;
    a.currentTime = Math.max(0, Math.min(time, a.duration || 0));
    if (b) b.currentTime = a.currentTime + offsetB;
    setCurrentTime(a.currentTime);
  }, [offsetB]);

  const togglePlay = useCallback(() => {
    const a = refA.current;
    const b = refB.current;
    if (!a) return;
    if (a.paused) {
      if (b) {
        b.currentTime = a.currentTime + offsetB;
        b.play().catch(() => {});
      }
      a.play().catch(() => {});
      setPlaying(true);
      startLoop();
    } else {
      a.pause();
      if (b) b.pause();
      setPlaying(false);
      stopLoop();
    }
  }, [offsetB, startLoop, stopLoop]);

  const changeRate = useCallback((rate: number) => {
    if (refA.current) refA.current.playbackRate = rate;
    if (refB.current) refB.current.playbackRate = rate;
    setPlaybackRate(rate);
  }, []);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  return { refA, refB, currentTime, durationA, playing, playbackRate, seekTo, togglePlay, changeRate };
}
