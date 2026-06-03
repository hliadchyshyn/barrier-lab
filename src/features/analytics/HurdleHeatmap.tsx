import { Box, Text, Tooltip, Group, Stack } from '@mantine/core';
import type { SplitStat } from '../../types';

interface Props { splits: SplitStat[] }

function interpolateColor(ratio: number): string {
  const r = Math.round(ratio * 220);
  const g = Math.round((1 - ratio) * 200);
  return `rgb(${r},${g},60)`;
}

export function HurdleHeatmap({ splits }: Props) {
  const interSplits = splits.filter(s => s.isInterHurdle);
  if (interSplits.length === 0) return null;
  const min = Math.min(...interSplits.map(s => s.duration));
  const max = Math.max(...interSplits.map(s => s.duration));
  const range = max - min || 1;

  return (
    <Stack gap="xs">
      <Text fw={600}>Hurdle Speed Heatmap</Text>
      <Group gap={6}>
        {interSplits.map(s => {
          const ratio = (s.duration - min) / range;
          return (
            <Tooltip key={s.label} label={`${s.label}: ${s.duration.toFixed(3)}s`}>
              <Box w={44} h={44} style={{ background: interpolateColor(ratio), borderRadius: 6, cursor: 'default' }}>
                <Text ta="center" size="xs" c="white" fw={700} pt={4}>{s.label.split('→')[0]}</Text>
                <Text ta="center" size="xs" c="white">{s.duration.toFixed(2)}</Text>
              </Box>
            </Tooltip>
          );
        })}
      </Group>
      <Group gap="xs">
        <Box w={12} h={12} style={{ background: 'rgb(0,200,60)', borderRadius: 2 }} />
        <Text size="xs">Fast</Text>
        <Box w={12} h={12} style={{ background: 'rgb(220,0,60)', borderRadius: 2 }} />
        <Text size="xs">Slow</Text>
      </Group>
    </Stack>
  );
}
