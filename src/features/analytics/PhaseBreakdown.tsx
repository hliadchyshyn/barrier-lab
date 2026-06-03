import { Box, Group, Text, Tooltip, Stack } from '@mantine/core';
import type { PhaseRatios } from '../../lib/analytics';

interface Props { ratios: PhaseRatios }

function PhaseBar({ label, ratio, color }: { label: string; ratio: number; color: string }) {
  return (
    <Tooltip label={`${label}: ${(ratio * 100).toFixed(1)}%`}>
      <Box h="100%" style={{ flex: ratio, background: color, minWidth: 30 }} />
    </Tooltip>
  );
}

export function PhaseBreakdown({ ratios }: Props) {
  return (
    <Stack gap="xs">
      <Text fw={600}>Phase Breakdown</Text>
      <Box h={36} style={{ display: 'flex', borderRadius: 6, overflow: 'hidden' }}>
        <PhaseBar label="Start (acceleration)"   ratio={ratios.start}  color="var(--mantine-color-green-5)" />
        <PhaseBar label="Race (hurdle-to-hurdle)" ratio={ratios.race}   color="var(--mantine-color-blue-5)" />
        <PhaseBar label="Finish"                  ratio={ratios.finish} color="var(--mantine-color-orange-5)" />
      </Box>
      <Group gap="md">
        {([['Start', ratios.start, 'green'], ['Race', ratios.race, 'blue'], ['Finish', ratios.finish, 'orange']] as const)
          .map(([label, ratio, color]) => (
            <Group key={label} gap={4}>
              <Box w={12} h={12} bg={`${color}.5`} style={{ borderRadius: 2 }} />
              <Text size="xs">{label}: {(ratio * 100).toFixed(1)}%</Text>
            </Group>
          ))}
      </Group>
    </Stack>
  );
}
