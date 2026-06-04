import { useEffect, useRef } from 'react';
import { Table, Text, Badge, Group, Paper } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { NormalizedLandmark, PoseAngles, HurdlePhase } from './usePose';
import {
  TORSO_CONFIG, KNEE_CONFIG, ELBOW_CONFIG,
  evaluateAngle, rangeLabel,
  type AnglePhaseConfig, type KneePhaseConfig, type PhaseRange, type BadgeStatus,
} from './angleConfig';

const SKELETON: [number, number][] = [
  [11, 12], [11, 13], [13, 15],
  [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27],
  [24, 26], [26, 28],
];

interface OverlayProps {
  allLandmarks: NormalizedLandmark[][] | null;
  selectedPoseIdx: number;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

function drawPose(
  ctx: CanvasRenderingContext2D,
  lm: NormalizedLandmark[],
  vw: number,
  vh: number,
  selected: boolean,
  label: string,
) {
  const alpha = selected ? 1 : 0.35;
  const boneColor  = selected ? `rgba(57,255,20,${alpha})`   : `rgba(180,180,180,${alpha})`;
  const dotColor   = selected ? `rgba(255,68,68,${alpha})`   : `rgba(200,200,200,${alpha})`;
  const labelBg    = selected ? 'rgba(57,255,20,0.9)'        : 'rgba(180,180,180,0.7)';
  const labelFg    = selected ? '#000'                        : '#333';

  const lw = Math.max(2, vw / 320);
  ctx.strokeStyle = boneColor;
  ctx.lineWidth = lw;
  for (const [a, b] of SKELETON) {
    if (!lm[a] || !lm[b]) continue;
    ctx.beginPath();
    ctx.moveTo(lm[a].x * vw, lm[a].y * vh);
    ctx.lineTo(lm[b].x * vw, lm[b].y * vh);
    ctx.stroke();
  }

  const r = Math.max(3, vw / 240);
  ctx.fillStyle = dotColor;
  for (const pt of lm) {
    ctx.beginPath();
    ctx.arc(pt.x * vw, pt.y * vh, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const nose = lm[0];
  if (nose) {
    const tx = nose.x * vw;
    const ty = nose.y * vh - r * 3;
    const fontSize = Math.max(11, vw / 80);
    ctx.font = `bold ${fontSize}px sans-serif`;
    const metrics = ctx.measureText(label);
    const pad = 3;
    ctx.fillStyle = labelBg;
    ctx.beginPath();
    ctx.roundRect(tx - metrics.width / 2 - pad, ty - fontSize - pad, metrics.width + pad * 2, fontSize + pad * 2, 3);
    ctx.fill();
    ctx.fillStyle = labelFg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(label, tx, ty);
  }
}

export function PoseCanvas({ allLandmarks, selectedPoseIdx, videoRef }: OverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const vw = video.videoWidth  || video.clientWidth  || 640;
    const vh = video.videoHeight || video.clientHeight || 360;
    canvas.width  = vw;
    canvas.height = vh;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, vw, vh);

    if (!allLandmarks) return;

    allLandmarks.forEach((lm, i) => {
      if (i !== selectedPoseIdx) drawPose(ctx, lm, vw, vh, false, `${i + 1}`);
    });
    if (allLandmarks[selectedPoseIdx]) {
      drawPose(ctx, allLandmarks[selectedPoseIdx], vw, vh, true, `${selectedPoseIdx + 1}`);
    }
  }, [allLandmarks, selectedPoseIdx, videoRef]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        borderRadius: 8,
      }}
    />
  );
}

interface TableProps {
  angles: PoseAngles | null;
  phase: HurdlePhase | null;
}

const BADGE_COLOR: Record<BadgeStatus, string> = {
  ok:   'green',
  low:  'yellow',
  high: 'red',
};

function StatusBadge({ status, value }: { status: BadgeStatus; value: number }) {
  const { t } = useTranslation();
  const key = status === 'ok' ? 'pose.badge.ok' : status === 'low' ? 'pose.badge.low' : 'pose.badge.high';
  return (
    <Badge size="xs" color={BADGE_COLOR[status]}>
      {value.toFixed(1)}° {t(key)}
    </Badge>
  );
}

interface AngleRow {
  labelKey: string;
  noteKey: string;
  value: number;
  range: PhaseRange;
  sublabel?: string;
}

function buildRows(angles: PoseAngles, phase: HurdlePhase): AngleRow[] {
  const rows: AngleRow[] = [];

  rows.push({
    labelKey: TORSO_CONFIG.labelKey,
    noteKey: TORSO_CONFIG.noteKey,
    value: angles.torsoLean,
    range: TORSO_CONFIG.phases[phase],
  });

  const rightKnee = angles.rightKneeAngle;
  const leftKnee  = angles.leftKneeAngle;

  if (phase === 'clearance') {
    const [trailAngle, leadAngle, trailKey, leadKey] =
      rightKnee < leftKnee
        ? [rightKnee, leftKnee, 'pose.trailLeg', 'pose.leadLeg']
        : [leftKnee, rightKnee, 'pose.trailLeg', 'pose.leadLeg'];

    rows.push({
      labelKey: KNEE_CONFIG.labelKey,
      noteKey: KNEE_CONFIG.noteKey,
      value: trailAngle,
      range: KNEE_CONFIG.clearanceTrail,
      sublabel: trailKey,
    });
    rows.push({
      labelKey: KNEE_CONFIG.labelKey,
      noteKey: KNEE_CONFIG.noteKey,
      value: leadAngle,
      range: KNEE_CONFIG.clearanceLead,
      sublabel: leadKey,
    });
  } else {
    rows.push({
      labelKey: 'pose.rightKnee',
      noteKey: KNEE_CONFIG.noteKey,
      value: rightKnee,
      range: KNEE_CONFIG.phases[phase],
    });
    rows.push({
      labelKey: 'pose.leftKnee',
      noteKey: KNEE_CONFIG.noteKey,
      value: leftKnee,
      range: KNEE_CONFIG.phases[phase],
    });
  }

  rows.push({
    labelKey: 'pose.rightElbow',
    noteKey: ELBOW_CONFIG.noteKey,
    value: angles.rightElbowAngle,
    range: ELBOW_CONFIG.phases[phase],
  });
  rows.push({
    labelKey: 'pose.leftElbow',
    noteKey: ELBOW_CONFIG.noteKey,
    value: angles.leftElbowAngle,
    range: ELBOW_CONFIG.phases[phase],
  });

  return rows;
}

const PHASE_COLOR: Record<HurdlePhase, string> = {
  approach:  'blue',
  clearance: 'orange',
  descent:   'teal',
  running:   'gray',
};

export function PoseAnglesTable({ angles, phase }: TableProps) {
  const { t } = useTranslation();
  if (!angles || !phase) return null;

  const rows = buildRows(angles, phase);

  return (
    <Paper withBorder p="xs" radius="md">
      <Group mb="xs" gap="xs" align="center">
        <Text size="xs" c="dimmed">{t('pose.phase.label')}:</Text>
        <Badge size="sm" color={PHASE_COLOR[phase]}>{t(`pose.phase.${phase}`)}</Badge>
      </Group>
      <Table striped withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th><Text size="xs">{t('pose.joint')}</Text></Table.Th>
            <Table.Th><Text size="xs">{t('pose.angle')}</Text></Table.Th>
            <Table.Th><Text size="xs">{t('pose.typicalRange')}</Text></Table.Th>
            <Table.Th><Text size="xs">{t('pose.note')}</Text></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((r, i) => {
            const status = evaluateAngle(r.value, r.range);
            return (
              <Table.Tr key={i}>
                <Table.Td>
                  <Text size="sm">{t(r.labelKey)}</Text>
                  {r.sublabel && <Text size="xs" c="dimmed">{t(r.sublabel)}</Text>}
                </Table.Td>
                <Table.Td>
                  <StatusBadge status={status} value={r.value} />
                </Table.Td>
                <Table.Td>
                  <Text size="xs" c="dimmed">{rangeLabel(r.range)}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="xs" c="dimmed">{t(r.noteKey)}</Text>
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Paper>
  );
}
