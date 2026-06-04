import { useEffect } from 'react';
import { ActionIcon, Group, Text, Slider, SegmentedControl, Stack } from '@mantine/core';
import { IconPlayerPlay, IconPlayerPause, IconPlayerSkipBack, IconPlayerSkipForward } from '@tabler/icons-react';
import { useVideoPlayer } from './useVideoPlayer';
import { formatTime } from '../../lib/compute';

interface Props {
  src: string | null;
  onTimeChange?: (t: number) => void;
  onDurationChange?: (d: number) => void;
  seekToTime?: number | null;
  videoElRef?: React.RefObject<HTMLVideoElement | null>;
}

export function VideoPlayer({ src, onTimeChange, onDurationChange, seekToTime, videoElRef }: Props) {
  const { videoRef, currentTime, duration, playing, playbackRate,
          togglePlay, seekTo, stepBack, stepForward, changeRate } = useVideoPlayer(src, videoElRef);

  useEffect(() => {
    if (seekToTime != null) seekTo(seekToTime);
  }, [seekToTime, seekTo]);

  useEffect(() => {
    if (duration > 0) onDurationChange?.(duration);
  }, [duration, onDurationChange]);

  return (
    <Stack gap="xs">
      <video
        ref={videoRef}
        src={src ?? undefined}
        style={{ width: '100%', maxHeight: '50vh', background: '#000', borderRadius: 8 }}
        onTimeUpdate={() => onTimeChange?.(videoRef.current?.currentTime ?? 0)}
      />
      <Slider
        value={duration ? (currentTime / duration) * 100 : 0}
        onChange={v => seekTo((v / 100) * duration)}
        label={null}
        size="sm"
      />
      <Group justify="center" gap="xs">
        <ActionIcon onClick={stepBack}   variant="subtle"><IconPlayerSkipBack size={20} /></ActionIcon>
        <ActionIcon onClick={togglePlay} variant="filled" size="lg">
          {playing ? <IconPlayerPause size={20} /> : <IconPlayerPlay size={20} />}
        </ActionIcon>
        <ActionIcon onClick={stepForward} variant="subtle"><IconPlayerSkipForward size={20} /></ActionIcon>
        <Text size="sm" c="dimmed">{formatTime(currentTime)} / {formatTime(duration)}</Text>
        <SegmentedControl
          size="xs"
          value={String(playbackRate)}
          onChange={v => changeRate(Number(v))}
          data={['0.25', '0.5', '1', '2'].map(v => ({ label: `${v}×`, value: v }))}
        />
      </Group>
    </Stack>
  );
}
