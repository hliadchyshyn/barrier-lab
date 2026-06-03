import { Paper, Text, Title, Stack, RingProgress, Group } from '@mantine/core';

interface Props { score: number }

export function RhythmGauge({ score }: Props) {
  const color = score >= 90 ? 'green' : score >= 75 ? 'blue' : score >= 60 ? 'yellow' : 'red';
  const label = score >= 90 ? 'Elite consistency'
              : score >= 75 ? 'Good rhythm'
              : score >= 60 ? 'Moderate variation'
              : 'High variation — check technique';

  return (
    <Paper withBorder p="md" radius="md">
      <Group justify="center" gap="xl">
        <RingProgress
          size={120}
          thickness={12}
          sections={[{ value: score, color }]}
          label={<Text ta="center" fw={700} size="xl">{score.toFixed(0)}</Text>}
        />
        <Stack gap={4}>
          <Title order={4}>Rhythm Score</Title>
          <Text size="sm" c="dimmed">{label}</Text>
          <Text size="xs" c="dimmed">100 = perfectly even hurdle-to-hurdle cadence</Text>
        </Stack>
      </Group>
    </Paper>
  );
}
