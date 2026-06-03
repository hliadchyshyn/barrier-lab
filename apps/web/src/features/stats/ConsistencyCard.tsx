import { SimpleGrid, Paper, Text, Title } from '@mantine/core';
import { formatTime } from '../../lib/compute';
import type { RunStats } from '../../types';

interface Props { stats: RunStats }

export function ConsistencyCard({ stats }: Props) {
  return (
    <SimpleGrid cols={4}>
      {[
        { label: 'Total Time',       value: stats.totalTime     != null ? formatTime(stats.totalTime) : '—' },
        { label: 'Consistency (STD)', value: stats.consistency  != null ? `${stats.consistency.toFixed(3)}s` : '—' },
        { label: 'Best Hurdle',      value: stats.bestHurdleIndex  != null ? `H${stats.bestHurdleIndex}`  : '—' },
        { label: 'Worst Hurdle',     value: stats.worstHurdleIndex != null ? `H${stats.worstHurdleIndex}` : '—' },
      ].map(({ label, value }) => (
        <Paper key={label} withBorder p="md" radius="md">
          <Text size="xs" c="dimmed">{label}</Text>
          <Title order={3}>{value}</Title>
        </Paper>
      ))}
    </SimpleGrid>
  );
}
