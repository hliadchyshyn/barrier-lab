import { LineChart } from '@mantine/charts';
import { Stack, Text } from '@mantine/core';
import type { TrendPoint } from '../../lib/analytics';

interface Props { points: TrendPoint[] }

export function FatigueTrend({ points }: Props) {
  const data = points
    .filter(p => p.fatigueIndex !== null)
    .map(p => ({ date: p.date, 'Fatigue index': Number(p.fatigueIndex!.toFixed(3)) }));

  if (data.length < 2) return null;

  return (
    <Stack gap="xs">
      <Text fw={600}>Fatigue Index Trend</Text>
      <Text size="xs" c="dimmed">1.0 = even pace · {'>'} 1.0 = fading · {'<'} 1.0 = finishing strong</Text>
      <LineChart h={180} data={data} dataKey="date"
        series={[{ name: 'Fatigue index', color: 'red' }]}
        curveType="monotone"
        referenceLines={[{ y: 1, color: 'gray', label: 'Even' }]}
      />
    </Stack>
  );
}
