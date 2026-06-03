import { useParams, useNavigate } from 'react-router-dom';
import { Stack, Title, Group, Button, Alert } from '@mantine/core';
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
  const { runs } = useRunsStore();
  const run = runs.find(r => r.id === runId);

  if (!run) return <div>Run not found</div>;

  const stats    = computeStats(run);
  const analysis = computeAnalytics(stats);
  const canAnalyze = stats.totalTime !== null && stats.interHurdleSplits.length >= 2;

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Analytics — {run.name}</Title>
        <Button variant="subtle" onClick={() => navigate(`/stats/${run.id}`)}>← Splits</Button>
      </Group>

      {!canAnalyze && (
        <Alert color="orange">Not enough data. Annotate all hurdles to unlock analytics.</Alert>
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
