import { BarChart } from '@mantine/charts';
import { Stack, Text } from '@mantine/core';

interface Props { ratios: { label: string; ratio: number }[] }

export function SegmentRatioChart({ ratios }: Props) {
  const data = ratios.map(r => ({
    segment: r.label,
    '% of total': Number((r.ratio * 100).toFixed(2)),
  }));

  return (
    <Stack gap="xs">
      <Text fw={600}>Segment Share of Total Time</Text>
      <BarChart
        h={220}
        data={data}
        dataKey="segment"
        series={[{ name: '% of total', color: 'violet' }]}
        tickLine="x"
        tooltipProps={{
          allowEscapeViewBox: { x: false, y: true },
          wrapperStyle: { zIndex: 100 },
          position: { y: -80 },
          cursor: { fill: 'rgba(255,255,255,0.05)' },
        }}
      />
    </Stack>
  );
}
