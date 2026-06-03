import { Box, Tooltip } from '@mantine/core';
import type { HurdleEvent } from '../../types';

interface Props {
  events: HurdleEvent[];
  duration: number;
  currentTime: number;
  onSeek: (time: number) => void;
}

function eventLabel(e: HurdleEvent) {
  if (e.type === 'start')  return 'Start';
  if (e.type === 'finish') return 'Finish';
  return `H${e.hurdleIndex}`;
}

function eventColor(e: HurdleEvent) {
  if (e.type === 'start')  return 'green';
  if (e.type === 'finish') return 'red';
  return 'blue';
}

export function EventTimeline({ events, duration, currentTime, onSeek }: Props) {
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Box pos="relative" h={32} bg="gray.1" style={{ borderRadius: 4, overflow: 'visible' }}>
      <Box pos="absolute" top={0} bottom={0} w={2} bg="orange"
        style={{ left: `${pct}%`, zIndex: 1 }} />

      {events.map((evt, i) => {
        const left = duration > 0 ? (evt.videoTime / duration) * 100 : 0;
        return (
          <Tooltip key={i} label={eventLabel(evt)}>
            <Box
              pos="absolute" top="4px" w={16} h={24}
              bg={eventColor(evt)}
              title={eventLabel(evt)}
              style={{
                left: `calc(${left}% - 8px)`,
                borderRadius: 3,
                cursor: 'pointer',
                zIndex: 2,
              }}
              onClick={() => onSeek(evt.videoTime)}
            />
          </Tooltip>
        );
      })}
    </Box>
  );
}
