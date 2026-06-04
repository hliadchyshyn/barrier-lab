import { useParams, useNavigate } from 'react-router-dom';
import { Stack, Title, Group, Button, Alert } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useRunsStore } from '../../store/runs';
import { computeStats } from '../../lib/compute';
import { computeAnalytics } from '../../lib/analytics';
import { PhaseBreakdown } from './PhaseBreakdown';
import { FatigueChart } from './FatigueChart';
import { RhythmGauge } from './RhythmGauge';
import { HurdleHeatmap } from './HurdleHeatmap';
import { SegmentRatioChart } from './SegmentRatioChart';

export function AnalyticsPage() {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { runs } = useRunsStore();
  const run = runs.find(r => r.id === runId);

  if (!run) return <div>{t('common.notFound')}</div>;

  const stats    = computeStats(run);
  const analysis = computeAnalytics(stats);
  const canAnalyze = stats.totalTime !== null && stats.interHurdleSplits.length >= 2;

  return (
    <Stack>
      <Group justify="space-between" wrap="nowrap" align="flex-start">
        <Title order={2} style={{ minWidth: 0 }}>{t('analytics.title', { name: run.name })}</Title>
        <Button variant="subtle" size="sm" onClick={() => navigate(`/stats/${run.id}`)} style={{ flexShrink: 0 }}>
          {t('analytics.back')}
        </Button>
      </Group>

      {!canAnalyze && (
        <Alert color="orange">{t('analytics.notEnoughData')}</Alert>
      )}

      {canAnalyze && (
        <>
          {analysis.phaseRatios && <PhaseBreakdown ratios={analysis.phaseRatios} />}
          {analysis.rhythmScore !== null && <RhythmGauge score={analysis.rhythmScore} />}
          {analysis.halfSplitAvg && analysis.fatigueIndex !== null && (
            <FatigueChart
              firstHalfAvg={analysis.halfSplitAvg.first}
              secondHalfAvg={analysis.halfSplitAvg.second}
              fatigueIndex={analysis.fatigueIndex}
            />
          )}
          <HurdleHeatmap splits={stats.splits} />
          {analysis.segmentRatios.length > 0 && (
            <SegmentRatioChart ratios={analysis.segmentRatios} />
          )}
        </>
      )}
    </Stack>
  );
}
