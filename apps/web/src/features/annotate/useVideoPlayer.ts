import { useRef, useState, useCallback, useEffect } from 'react';

const STEP = 1 / 30; // approximate single frame at 30fps

export function useVideoPlayer(_videoSrc: string | null) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onDuration   = () => setDuration(video.duration);
    const onPlay       = () => setPlaying(true);
    const onPause      = () => setPlaying(false);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('loadedmetadata', onDuration);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('loadedmetadata', onDuration);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.paused ? v.play() : v.pause();
  }, []);

  const seekTo = useCallback((time: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(time, v.duration || 0));
  }, []);

  const stepBack    = useCallback(() => seekTo((videoRef.current?.currentTime ?? 0) - STEP), [seekTo]);
  const stepForward = useCallback(() => seekTo((videoRef.current?.currentTime ?? 0) + STEP), [seekTo]);

  const changeRate = useCallback((rate: number) => {
    if (videoRef.current) videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space')      { e.preventDefault(); togglePlay(); }
      if (e.code === 'ArrowLeft')  { e.preventDefault(); stepBack(); }
      if (e.code === 'ArrowRight') { e.preventDefault(); stepForward(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [togglePlay, stepBack, stepForward]);

  return { videoRef, currentTime, duration, playing, playbackRate, togglePlay, seekTo, stepBack, stepForward, changeRate };
}
