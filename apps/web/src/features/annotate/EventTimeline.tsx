import { Box, Tooltip } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { HurdleEvent } from '../../types';

interface Props {
  events: HurdleEvent[];
  duration: number;
  currentTime: number;
  onSeek: (time: number) => void;
  selectedEventIdx: number | null;
  onSelectEvent: (idx: number) => void;
}

function eventColor(e: HurdleEvent) {
  if (e.type === 'start')  return 'green';
  if (e.type === 'finish') return 'red';
  return 'blue';
}

export function EventTimeline({ events, duration, currentTime, onSeek, selectedEventIdx, onSelectEvent }: Props) {
  const { t } = useTranslation();
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  function eventLabel(e: HurdleEvent) {
    if (e.type === 'start')  return t('event.start');
    if (e.type === 'finish') return t('event.finish');
    return `H${e.hurdleIndex}`;
  }

  return (
    <Box pos="relative" h={32} bg="gray.1" style={{ borderRadius: 4, overflow: 'visible' }}>
      <Box pos="absolute" top={0} bottom={0} w={2} bg="orange"
        style={{ left: `${pct}%`, zIndex: 1 }} />

      {events.map((evt, i) => {
        const left = duration > 0 ? (evt.videoTime / duration) * 100 : 0;
        const isSelected = selectedEventIdx === i;
        const hint = isSelected
          ? `${eventLabel(evt)} — ${t('annotate.timeline.undoHint')}`
          : `${eventLabel(evt)} — ${t('annotate.timeline.selectHint')}`;
        return (
          <Tooltip key={i} label={hint}>
            <Box
              pos="absolute" top="4px" w={16} h={24}
              bg={eventColor(evt)}
              title={eventLabel(evt)}
              style={{
                left: `calc(${left}% - 8px)`,
                borderRadius: 3,
                cursor: 'pointer',
                zIndex: 2,
                outline: isSelected ? '2px solid white' : undefined,
                boxShadow: isSelected ? '0 0 0 3px black' : undefined,
                transform: isSelected ? 'scaleY(1.25)' : undefined,
              }}
              onClick={() => {
                onSelectEvent(i);
                onSeek(evt.videoTime);
              }}
            />
          </Tooltip>
        );
      })}
    </Box>
  );
}
