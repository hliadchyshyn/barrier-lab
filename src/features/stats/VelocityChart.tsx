import { BarChart } from '@mantine/charts';
import type { SplitStat } from '../../types';

interface Props { splits: SplitStat[] }

export function VelocityChart({ splits }: Props) {
  const data = splits.map(s => ({ segment: s.label, 'Split (s)': Number(s.duration.toFixed(3)) }));
  return (
    <BarChart
      h={220}
      data={data}
      dataKey="segment"
      series={[{ name: 'Split (s)', color: 'blue' }]}
      tickLine="x"
    />
  );
}
