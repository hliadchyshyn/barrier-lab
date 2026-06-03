import { LineChart } from '@mantine/charts';
import { Stack, Text } from '@mantine/core';
import type { TrendPoint } from '../../lib/analytics';

interface Props { points: TrendPoint[] }

export function ConsistencyTrend({ points }: Props) {
  const data = points
    .filter(p => p.consistency !== null)
    .map(p => ({ date: p.date, 'Consistency STD (s)': Number(p.consistency!.toFixed(4)) }));

  if (data.length < 2) return null;

  const trend = data[data.length - 1]['Consistency STD (s)'] < data[0]['Consistency STD (s)']
    ? '↓ Improving (lower = more consistent)' : '↑ Worsening';

  return (
    <Stack gap="xs">
      <Text fw={600}>Consistency Trend (STD of inter-hurdle splits)</Text>
      <Text size="xs" c="dimmed">{trend}</Text>
      <LineChart h={180} data={data} dataKey="date"
        series={[{ name: 'Consistency STD (s)', color: 'orange' }]} curveType="monotone" />
    </Stack>
  );
}
