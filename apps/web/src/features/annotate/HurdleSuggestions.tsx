import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Stack, Group, Text, Button, Badge, ActionIcon,
  Paper, Divider, NumberInput, Alert, Select,
} from '@mantine/core';
import { IconCheck, IconX, IconTarget, IconAlertTriangle } from '@tabler/icons-react';
import type { HurdleEvent } from '../../types';

interface Props {
  suggestedTimes: number[];
  hurdleCount: number;
  currentTime: number;
  onAccept: (events: HurdleEvent[]) => void;
  onSeek: (time: number) => void;
  onDismiss: () => void;
}

type Status = 'pending' | 'accepted' | 'skipped';

export function HurdleSuggestions({
  suggestedTimes, hurdleCount, currentTime, onAccept, onSeek, onDismiss,
}: Props) {
  const { t } = useTranslation();
  const [times, setTimes]     = useState<number[]>(suggestedTimes);
  // hurdleNumbers are 1-based, editable — default: sequential 1,2,3…
  const [hurdleNums, setNums] = useState<number[]>(suggestedTimes.map((_, i) => i + 1));
  const [statuses, setStatuses] = useState<Status[]>(suggestedTimes.map(() => 'pending'));

  const hasMissing = suggestedTimes.length < hurdleCount;

  function setTime(i: number, time: number) {
    setTimes(prev => prev.map((v, j) => (j === i ? time : v)));
  }

  function setNum(i: number, n: number) {
    setNums(prev => prev.map((v, j) => (j === i ? n : v)));
  }

  function setStatus(i: number, status: Status) {
    setStatuses(prev => prev.map((v, j) => (j === i ? status : v)));
  }

  function acceptSingle(i: number) {
    setStatus(i, 'accepted');
    onAccept([{ type: 'hurdle', hurdleIndex: hurdleNums[i], videoTime: times[i] }]);
  }

  function acceptAll() {
    const events: HurdleEvent[] = times
      .map((time, i) => ({ type: 'hurdle' as const, hurdleIndex: hurdleNums[i], videoTime: time }))
      .filter((_, i) => statuses[i] === 'pending');
    if (events.length > 0) onAccept(events);
    setStatuses(prev => prev.map(s => (s === 'pending' ? 'accepted' : s)));
  }

  const pendingCount = statuses.filter(s => s === 'pending').length;

  // Detect duplicate hurdle numbers among non-skipped rows
  const numCounts = hurdleNums.reduce<Record<number, number>>((acc, n, i) => {
    if (statuses[i] !== 'skipped') acc[n] = (acc[n] ?? 0) + 1;
    return acc;
  }, {});
  const hasDuplicates = Object.values(numCounts).some(c => c > 1);

  return (
    <Paper withBorder p="sm" radius="md" bg="dark.7">
      <Stack gap="xs">
        <Group justify="space-between" wrap="nowrap">
          <Group gap="xs">
            <Text fw={600} size="sm">{t('annotate.suggest.title')}</Text>
            <Badge
              color={suggestedTimes.length >= hurdleCount ? 'green' : 'orange'}
              variant="light"
              size="sm"
            >
              {suggestedTimes.length}/{hurdleCount}
            </Badge>
          </Group>
          <Group gap={6}>
            <Button size="xs" onClick={acceptAll} disabled={pendingCount === 0 || hasDuplicates}>
              {t('annotate.suggest.acceptAll', { count: pendingCount })}
            </Button>
            <ActionIcon size="sm" variant="subtle" color="gray" onClick={onDismiss}>
              <IconX size={14} />
            </ActionIcon>
          </Group>
        </Group>

        {/* Warning when not all hurdles were found */}
        {hasMissing && (
          <Alert
            icon={<IconAlertTriangle size={14} />}
            color="orange"
            variant="light"
            p="xs"
          >
            <Text size="xs">
              {t('annotate.suggest.missingWarning', {
                found: suggestedTimes.length,
                total: hurdleCount,
              })}
            </Text>
          </Alert>
        )}

        {hasDuplicates && (
          <Alert icon={<IconAlertTriangle size={14} />} color="red" variant="light" p="xs">
            <Text size="xs">{t('annotate.suggest.duplicateWarning')}</Text>
          </Alert>
        )}

        <Divider />

        {times.length === 0 && (
          <Text size="xs" c="dimmed">{t('annotate.suggest.noDetected')}</Text>
        )}

        {times.map((time, i) => {
          const isDuplicate = (numCounts[hurdleNums[i]] ?? 0) > 1 && statuses[i] !== 'skipped';
          return (
            <Group key={i} gap="xs" justify="space-between" wrap="nowrap">
              {/* Hurdle number selector */}
              <Select
                value={String(hurdleNums[i])}
                onChange={v => v && setNum(i, Number(v))}
                data={Array.from({ length: hurdleCount }, (_, k) => ({
                  value: String(k + 1),
                  label: `H${k + 1}`,
                }))}
                size="xs"
                style={{ width: 72 }}
                disabled={statuses[i] !== 'pending'}
                styles={{
                  input: isDuplicate ? { borderColor: 'var(--mantine-color-red-6)' } : {},
                }}
                allowDeselect={false}
              />

              {/* Editable time */}
              <NumberInput
                value={time}
                onChange={v => typeof v === 'number' && setTime(i, v)}
                decimalScale={3}
                step={1 / 30}
                min={0}
                size="xs"
                style={{ width: 90 }}
                rightSection={<Text size="10px" c="dimmed">s</Text>}
                disabled={statuses[i] !== 'pending'}
              />

              <Group gap={4} wrap="nowrap">
                {/* Seek to suggestion */}
                <ActionIcon
                  size="xs"
                  variant="subtle"
                  onClick={() => onSeek(time)}
                  title={t('annotate.suggest.seek')}
                >
                  <IconTarget size={12} />
                </ActionIcon>

                {/* Snap to current video time */}
                {statuses[i] === 'pending' && (
                  <Button
                    size="xs"
                    variant="subtle"
                    px={6}
                    onClick={() => setTime(i, parseFloat(currentTime.toFixed(3)))}
                    title={t('annotate.suggest.useCurrent')}
                  >
                    ← {currentTime.toFixed(2)}s
                  </Button>
                )}

                {/* Accept */}
                {statuses[i] === 'pending' && (
                  <ActionIcon
                    size="xs"
                    color="green"
                    variant="light"
                    disabled={isDuplicate}
                    onClick={() => acceptSingle(i)}
                  >
                    <IconCheck size={12} />
                  </ActionIcon>
                )}

                {/* Skip */}
                {statuses[i] === 'pending' && (
                  <ActionIcon size="xs" color="gray" variant="subtle" onClick={() => setStatus(i, 'skipped')}>
                    <IconX size={12} />
                  </ActionIcon>
                )}

                {/* Undo skip */}
                {statuses[i] === 'skipped' && (
                  <Button size="xs" variant="subtle" color="gray" onClick={() => setStatus(i, 'pending')}>
                    {t('annotate.suggest.restore')}
                  </Button>
                )}

                {statuses[i] === 'accepted' && (
                  <Badge color="green" size="xs" variant="light">{t('annotate.suggest.accepted')}</Badge>
                )}
              </Group>
            </Group>
          );
        })}
      </Stack>
    </Paper>
  );
}
