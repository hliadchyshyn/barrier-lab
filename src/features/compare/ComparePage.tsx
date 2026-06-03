import { useState } from 'react';
import { Stack, Title, Select, Group, Text } from '@mantine/core';
import { useRunsStore } from '../../store/runs';
import { computeStats, computeDelta } from '../../lib/compute';
import { DeltaTable } from './DeltaTable';
import { OverlayChart } from './OverlayChart';

export function ComparePage() {
  const { runs } = useRunsStore();
  const [idA, setIdA] = useState<string | null>(null);
  const [idB, setIdB] = useState<string | null>(null);

  const runA = runs.find(r => r.id === idA);
  const runB = runs.find(r => r.id === idB);
  const options = runs.map(r => ({ value: r.id, label: r.name }));

  const statsA = runA ? computeStats(runA) : null;
  const statsB = runB ? computeStats(runB) : null;
  const deltas = statsA && statsB ? computeDelta(statsA, statsB) : [];

  return (
    <Stack>
      <Title order={2}>Compare Runs</Title>
      <Group>
        <Select label="Run A" placeholder="Select run" data={options}
          value={idA} onChange={setIdA} style={{ flex: 1 }} />
        <Select label="Run B" placeholder="Select run" data={options}
          value={idB} onChange={setIdB} style={{ flex: 1 }} />
      </Group>

      {runA && runB && deltas.length > 0 ? (
        <>
          <Text size="sm" c="dimmed">Green delta = Run B is faster. Red = Run B is slower.</Text>
          <OverlayChart deltas={deltas} nameA={runA.name} nameB={runB.name} />
          <DeltaTable deltas={deltas} />
        </>
      ) : (
        <Text c="dimmed">Select two runs to compare their splits.</Text>
      )}
    </Stack>
  );
}
