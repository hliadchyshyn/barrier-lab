import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Stack, Title, Group, Button, Textarea } from '@mantine/core';
import { useDebouncedCallback } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const run = runs.find(r => r.id === runId);

  const [notes, setNotes] = useState(run?.notes ?? '');
  const saveNotes = useDebouncedCallback((v: string) => {
    if (run) updateRun(run.id, { notes: v });
  }, 800);

  if (!run) return <div>{t('common.notFound')}</div>;

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
      <Stack gap="xs">
        <Title order={2}>{run.name}</Title>
        <Group gap="xs" wrap="wrap">
          <Button variant="outline" size="sm" onClick={() => navigate(`/annotate/${run.id}`)}>{t('stats.reAnnotate')}</Button>
          <Button variant="outline" size="sm" onClick={() => navigate(`/analytics/${run.id}`)}>{t('stats.deepAnalytics')}</Button>
          <Button variant="outline" size="sm" onClick={() => downloadCSV(runsToCSV([run]), `${run.name}-splits.csv`)}>
            {t('stats.exportCsv')}
          </Button>
        </Group>
      </Stack>

      <ConsistencyCard stats={stats} />
      <VelocityChart splits={stats.splits} />
      <SplitTable
        splits={splitsWithPB}
        bestHurdleIndex={stats.bestHurdleIndex}
        worstHurdleIndex={stats.worstHurdleIndex}
      />

      <Textarea
        label={t('stats.sessionNotes')}
        placeholder={t('stats.sessionNotesPlaceholder')}
        value={notes}
        onChange={e => { setNotes(e.target.value); saveNotes(e.target.value); }}
        autosize
        minRows={2}
      />
    </Stack>
  );
}
