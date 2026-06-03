import { BarChart } from '@mantine/charts';
import type { SplitDelta } from '../../types';

interface Props { deltas: SplitDelta[]; nameA: string; nameB: string }

export function OverlayChart({ deltas, nameA, nameB }: Props) {
  const data = deltas.map(d => ({
    segment: d.label,
    [nameA]: d.durationA ?? 0,
    [nameB]: d.durationB ?? 0,
  }));

  return (
    <BarChart
      h={250}
      data={data}
      dataKey="segment"
      series={[
        { name: nameA, color: 'blue' },
        { name: nameB, color: 'orange' },
      ]}
      tickLine="x"
    />
  );
}
