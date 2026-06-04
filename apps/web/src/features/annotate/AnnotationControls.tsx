import { Button, Group, Stack, Badge } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { HurdleEvent, Run } from '../../types';

interface Props {
  run: Run;
  events: HurdleEvent[];
  currentTime: number;
  onMark: (event: HurdleEvent) => void;
  onUndo: () => void;
  selectedEventIdx: number | null;
}

export function AnnotationControls({ run, events, currentTime, onMark, onUndo, selectedEventIdx }: Props) {
  const { t } = useTranslation();
  const hasStart  = events.some(e => e.type === 'start');
  const hasFinish = events.some(e => e.type === 'finish');
  const markedHurdles = events.filter(e => e.type === 'hurdle').map(e => e.hurdleIndex!);
  const nextHurdle = Array.from({ length: run.hurdleCount }, (_, i) => i + 1)
    .find(i => !markedHurdles.includes(i));

  const selectedEvent = selectedEventIdx !== null ? events[selectedEventIdx] : null;
  function undoLabel() {
    if (!selectedEvent) return t('annotate.undo');
    if (selectedEvent.type === 'start')  return t('annotate.undoStart');
    if (selectedEvent.type === 'finish') return t('annotate.undoFinish');
    return t('annotate.undoHurdle', { n: selectedEvent.hurdleIndex });
  }

  return (
    <Stack>
      <Group>
        <Button color="green" disabled={hasStart}
          onClick={() => onMark({ type: 'start', videoTime: currentTime })}>
          {t('annotate.markStart')}
        </Button>

        <Button color="blue"
          disabled={!hasStart || hasFinish || nextHurdle === undefined}
          onClick={() => nextHurdle !== undefined && onMark({ type: 'hurdle', hurdleIndex: nextHurdle, videoTime: currentTime })}>
          {nextHurdle !== undefined
            ? t('annotate.markHurdle', { n: nextHurdle })
            : t('annotate.markHurdleNA')}
        </Button>

        <Button color="red"
          disabled={!hasStart || hasFinish || markedHurdles.length < run.hurdleCount}
          onClick={() => onMark({ type: 'finish', videoTime: currentTime })}>
          {t('annotate.markFinish')}
        </Button>

        <Button
          variant={selectedEvent ? 'filled' : 'subtle'}
          color={selectedEvent ? 'orange' : undefined}
          onClick={onUndo}
          disabled={events.length === 0}
        >
          {undoLabel()}
        </Button>
      </Group>

      <Group gap="xs">
        {['start', ...Array.from({ length: run.hurdleCount }, (_, i) => `h${i + 1}`), 'finish']
          .map(key => {
            const done = key === 'start' ? hasStart
              : key === 'finish' ? hasFinish
              : markedHurdles.includes(Number(key.slice(1)));
            return (
              <Badge key={key} color={done ? 'green' : 'gray'} variant="dot">
                {key === 'start' ? 'S' : key === 'finish' ? 'F' : key.toUpperCase()}
              </Badge>
            );
          })}
      </Group>
    </Stack>
  );
}
