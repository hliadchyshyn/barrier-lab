import { Stack, Title, Select, Text } from '@mantine/core';
import { useState } from 'react';
import { useRunsStore } from '../../store/runs';
import { computeTrends } from '../../lib/analytics';
import { TotalTimeTrend } from './TotalTimeTrend';
import { HurdleSplitTrend } from './HurdleSplitTrend';
import { ConsistencyTrend } from './ConsistencyTrend';
import { FatigueTrend } from './FatigueTrend';
import { DISCIPLINE_PRESETS } from '../../types';
import type { Discipline } from '../../types';

export function TrendsPage() {
  const { runs } = useRunsStore();
  const [discipline, setDiscipline] = useState<Discipline>('110m-hurdles');
  const filtered = runs.filter(r => r.discipline === discipline && r.events.some(e => e.type === 'finish'));
  const points = computeTrends(filtered);

  return (
    <Stack>
      <Title order={2}>Season Trends</Title>
      <Select
        label="Discipline"
        value={discipline}
        onChange={v => setDiscipline(v as Discipline)}
        data={Object.entries(DISCIPLINE_PRESETS).map(([k, v]) => ({ value: k, label: v.label }))}
        style={{ maxWidth: 280 }}
      />
      {filtered.length < 2 && (
        <Text c="dimmed">Add at least 2 fully annotated runs for this discipline to see trends.</Text>
      )}
      {filtered.length >= 2 && (
        <>
          <TotalTimeTrend points={points} />
          <HurdleSplitTrend points={points} />
          <ConsistencyTrend points={points} />
          <FatigueTrend points={points} />
        </>
      )}
    </Stack>
  );
}
