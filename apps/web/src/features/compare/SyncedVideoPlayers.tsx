import { Group, Stack, ActionIcon, Slider, Text, SegmentedControl, Title, Alert } from '@mantine/core';
import { IconPlayerPlay, IconPlayerPause } from '@tabler/icons-react';
import { useSyncedVideos } from './useSyncedVideos';
import { EventTimeline } from '../annotate/EventTimeline';
import { formatTime } from '../../lib/compute';
import type { Run } from '../../types';

interface Props {
  runA: Run;
  runB: Run;
  srcA: string | null;
  srcB: string | null;
}

export function SyncedVideoPlayers({ runA, runB, srcA, srcB }: Props) {
  const startEventA = runA.events.find(e => e.type === 'start');
  const startEventB = runB.events.find(e => e.type === 'start');

  const offsetB = startEventA && startEventB
    ? startEventA.videoTime - startEventB.videoTime
    : 0;

  const { refA, refB, currentTime, durationA, durationB, playing, playbackRate, seekTo, togglePlay, changeRate } =
    useSyncedVideos(offsetB);

  const pct = durationA ? (currentTime / durationA) * 100 : 0;

  if (!startEventA || !startEventB) {
    return (
      <Alert color="orange">
        Both runs must have a marked Start event to enable synchronized playback.
      </Alert>
    );
  }

  return (
    <Stack gap="sm">
      <Group grow align="flex-start" gap="sm">
        <Stack gap="xs">
          <Title order={5}>{runA.name}</Title>
          <video
            ref={refA}
            src={srcA ?? undefined}
            style={{ width: '100%', background: '#000', borderRadius: 8, maxHeight: '40vh' }}
          />
          <EventTimeline
            events={runA.events}
            duration={durationA}
            currentTime={currentTime}
            onSeek={seekTo}
            selectedEventIdx={null}
            onSelectEvent={() => {}}
          />
        </Stack>
        <Stack gap="xs">
          <Title order={5}>{runB.name}</Title>
          <video
            ref={refB}
            src={srcB ?? undefined}
            style={{ width: '100%', background: '#000', borderRadius: 8, maxHeight: '40vh' }}
          />
          <EventTimeline
            events={runB.events}
            duration={durationB}
            currentTime={currentTime + offsetB}
            onSeek={t => seekTo(t - offsetB)}
            selectedEventIdx={null}
            onSelectEvent={() => {}}
          />
        </Stack>
      </Group>

      <Group gap="xs" align="center">
        <ActionIcon onClick={togglePlay} variant="filled" size="lg">
          {playing ? <IconPlayerPause size={20} /> : <IconPlayerPlay size={20} />}
        </ActionIcon>
        <Slider
          style={{ flex: 1 }}
          value={pct}
          disabled={durationA === 0}
          onChange={v => seekTo((v / 100) * durationA)}
          label={null}
          size="sm"
        />
        <Text size="sm" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
          {formatTime(currentTime)} / {formatTime(durationA)}
        </Text>
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
