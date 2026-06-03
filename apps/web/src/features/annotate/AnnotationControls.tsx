import { Button, Group, Stack, Badge } from '@mantine/core';
import type { HurdleEvent, Run } from '../../types';

interface Props {
  run: Run;
  events: HurdleEvent[];
  currentTime: number;
  onMark: (event: HurdleEvent) => void;
  onUndo: () => void;
}

export function AnnotationControls({ run, events, currentTime, onMark, onUndo }: Props) {
  const hasStart  = events.some(e => e.type === 'start');
  const hasFinish = events.some(e => e.type === 'finish');
  const markedHurdles = events.filter(e => e.type === 'hurdle').map(e => e.hurdleIndex!);
  const nextHurdle = Array.from({ length: run.hurdleCount }, (_, i) => i + 1)
    .find(i => !markedHurdles.includes(i));

  return (
    <Stack>
      <Group>
        <Button color="green" disabled={hasStart}
          onClick={() => onMark({ type: 'start', videoTime: currentTime })}>
          Mark Start
        </Button>

        <Button color="blue"
          disabled={!hasStart || hasFinish || nextHurdle === undefined}
          onClick={() => nextHurdle !== undefined && onMark({ type: 'hurdle', hurdleIndex: nextHurdle, videoTime: currentTime })}>
          {nextHurdle !== undefined ? `Mark H${nextHurdle}` : 'Mark H—'}
        </Button>

        <Button color="red"
          disabled={!hasStart || hasFinish || markedHurdles.length < run.hurdleCount}
          onClick={() => onMark({ type: 'finish', videoTime: currentTime })}>
          Mark Finish
        </Button>

        <Button variant="subtle" onClick={onUndo} disabled={events.length === 0}>
          Undo
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
