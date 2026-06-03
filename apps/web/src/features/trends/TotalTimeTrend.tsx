import { LineChart } from '@mantine/charts';
import { Stack, Text } from '@mantine/core';
import type { TrendPoint } from '../../lib/analytics';
import { formatTime } from '../../lib/compute';

interface Props { points: TrendPoint[] }

export function TotalTimeTrend({ points }: Props) {
  const data = points
    .filter(p => p.totalTime !== null)
    .map(p => ({ date: p.date, 'Total time (s)': Number(p.totalTime!.toFixed(3)) }));

  if (data.length < 2) return <Text c="dimmed" size="sm">Need at least 2 runs to show trend.</Text>;

  const best   = Math.min(...data.map(d => d['Total time (s)']));
  const latest = data[data.length - 1]['Total time (s)'];
  const delta  = latest - best;

  return (
    <Stack gap="xs">
      <Text fw={600}>Total Time Trend</Text>
      <Text size="xs" c="dimmed">
        Best: {formatTime(best)} · Latest: {formatTime(latest)} · vs PB: {delta > 0 ? `+${delta.toFixed(3)}s` : `${delta.toFixed(3)}s`}
      </Text>
      <LineChart h={200} data={data} dataKey="date"
        series={[{ name: 'Total time (s)', color: 'blue' }]} curveType="monotone" />
    </Stack>
  );
}
