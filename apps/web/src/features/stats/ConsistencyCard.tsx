import { SimpleGrid, Paper, Text, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { formatTime } from '../../lib/compute';
import type { RunStats } from '../../types';

interface Props { stats: RunStats }

export function ConsistencyCard({ stats }: Props) {
  const { t } = useTranslation();
  return (
    <SimpleGrid cols={{ base: 2, sm: 4 }}>
      {[
        { label: t('stats.totalTime'),   value: stats.totalTime     != null ? formatTime(stats.totalTime) : '—' },
        { label: t('stats.consistency'), value: stats.consistency   != null ? `${stats.consistency.toFixed(3)}s` : '—' },
        { label: t('stats.bestHurdle'),  value: stats.bestHurdleIndex  != null ? `H${stats.bestHurdleIndex}`  : '—' },
        { label: t('stats.worstHurdle'), value: stats.worstHurdleIndex != null ? `H${stats.worstHurdleIndex}` : '—' },
      ].map(({ label, value }) => (
        <Paper key={label} withBorder p="md" radius="md">
          <Text size="xs" c="dimmed">{label}</Text>
          <Title order={3}>{value}</Title>
        </Paper>
      ))}
    </SimpleGrid>
  );
}
