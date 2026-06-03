import { BarChart } from '@mantine/charts';
import { Stack, Text, Badge, Group } from '@mantine/core';

interface Props {
  firstHalfAvg: number;
  secondHalfAvg: number;
  fatigueIndex: number;
}

export function FatigueChart({ firstHalfAvg, secondHalfAvg, fatigueIndex }: Props) {
  const data = [
    { half: 'First half',  'Avg split (s)': Number(firstHalfAvg.toFixed(3)) },
    { half: 'Second half', 'Avg split (s)': Number(secondHalfAvg.toFixed(3)) },
  ];
  const label = fatigueIndex > 1.03 ? 'Fading' : fatigueIndex < 0.97 ? 'Finishing strong' : 'Even';
  const color = fatigueIndex > 1.03 ? 'red' : fatigueIndex < 0.97 ? 'green' : 'blue';

  return (
    <Stack gap="xs">
      <Group>
        <Text fw={600}>Fatigue Analysis</Text>
        <Badge color={color}>{label} — index: {fatigueIndex.toFixed(3)}</Badge>
      </Group>
      <BarChart h={180} data={data} dataKey="half"
        series={[{ name: 'Avg split (s)', color: 'blue' }]} tickLine="x" />
    </Stack>
  );
}
