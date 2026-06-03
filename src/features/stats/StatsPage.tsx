import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Stack, Title, Group, Button, Textarea } from '@mantine/core';
import { useDebouncedCallback } from '@mantine/hooks';
import { useRunsStore } from '../../store/runs';
import { computeStats } from '../../lib/compute';
import { downloadCSV, runsToCSV } from '../../lib/csv';
import { SplitTable } from './SplitTable';
import { VelocityChart } from './VelocityChart';
import { ConsistencyCard } from './ConsistencyCard';

export function StatsPage() {
  const { runId } = useParams<{ runId: string }>();
  const { runs, updateRun } = useRunsStore();
  const navigate = useNavigate();
  const run = runs.find(r => r.id === runId);

  const [notes, setNotes] = useState(run?.notes ?? '');
  const saveNotes = useDebouncedCallback((v: string) => {
    if (run) updateRun(run.id, { notes: v });
  }, 800);

  if (!run) return <div>Run not found</div>;

  const stats = computeStats(run);

  // Personal best: mark splits that are faster than any previous run of same discipline
  const historicSplits = runs
    .filter(r => r.id !== run.id && r.discipline === run.discipline)
    .flatMap(r => computeStats(r).splits);

  const splitsWithPB = stats.splits.map(s => ({
    ...s,
    isPB: !historicSplits.some(h => h.label === s.label && h.duration <= s.duration),
  }));

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>{run.name}</Title>
        <Group>
          <Button variant="outline" onClick={() => navigate(`/annotate/${run.id}`)}>Re-annotate</Button>
          <Button variant="outline" onClick={() => navigate(`/analytics/${run.id}`)}>Deep Analytics</Button>
          <Button variant="outline" onClick={() => downloadCSV(runsToCSV([run]), `${run.name}-splits.csv`)}>
            Export CSV
          </Button>
        </Group>
      </Group>

      <ConsistencyCard stats={stats} />
      <VelocityChart splits={stats.splits} />
      <SplitTable
        splits={splitsWithPB}
        bestHurdleIndex={stats.bestHurdleIndex}
        worstHurdleIndex={stats.worstHurdleIndex}
      />

      <Textarea
        label="Session notes"
        placeholder="Weather, fatigue level, training context, coach feedback..."
        value={notes}
        onChange={e => { setNotes(e.target.value); saveNotes(e.target.value); }}
        autosize
        minRows={2}
      />
    </Stack>
  );
}
