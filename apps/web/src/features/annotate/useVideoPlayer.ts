import { useRef, useState, useCallback, useEffect } from 'react';

const STEP = 1 / 30;

export function useVideoPlayer(
  _videoSrc: string | null,
  externalRef?: React.RefObject<HTMLVideoElement | null>,
) {
  const internalRef = useRef<HTMLVideoElement>(null);
  const videoRef = (externalRef ?? internalRef) as React.RefObject<HTMLVideoElement>;
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.paused ? v.play() : v.pause();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const seekTo = useCallback((time: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(time, v.duration || 0));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stepBack    = useCallback(() => seekTo((videoRef.current?.currentTime ?? 0) - STEP), [seekTo]);
  const stepForward = useCallback(() => seekTo((videoRef.current?.currentTime ?? 0) + STEP), [seekTo]);

  const changeRate = useCallback((rate: number) => {
    if (videoRef.current) videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
