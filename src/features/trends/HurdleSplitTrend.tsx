import { LineChart } from '@mantine/charts';
import { Stack, Text, MultiSelect } from '@mantine/core';
import { useState } from 'react';
import type { TrendPoint } from '../../lib/analytics';

interface Props { points: TrendPoint[] }

const COLORS = ['blue', 'red', 'green', 'orange', 'violet', 'teal', 'pink', 'cyan', 'grape', 'lime'];

export function HurdleSplitTrend({ points }: Props) {
  const allLabels = Array.from(new Set(points.flatMap(p => Object.keys(p.hurdleSplits))));
  const [selected, setSelected] = useState<string[]>(allLabels.slice(0, 3));

  const data = points.map(p => {
    const row: Record<string, string | number | null> = { date: p.date };
    selected.forEach(label => { row[label] = p.hurdleSplits[label] ?? null; });
    return row;
  });

  const series = selected.map((label, i) => ({ name: label, color: COLORS[i % COLORS.length] }));

  return (
    <Stack gap="xs">
      <Text fw={600}>Per-Hurdle Split Trends</Text>
      <MultiSelect
        data={allLabels}
        value={selected}
        onChange={setSelected}
        label="Show splits"
        placeholder="Select splits to compare"
        maxValues={5}
      />
      {data.length >= 2
        ? <LineChart h={220} data={data} dataKey="date" series={series} curveType="monotone" />
        : <Text c="dimmed" size="sm">Need at least 2 runs.</Text>}
    </Stack>
  );
}
