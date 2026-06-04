import { useEffect, useRef } from 'react';
import { Table, Text, Badge, Group } from '@mantine/core';
import type { NormalizedLandmark, PoseAngles } from './usePose';

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

  // Label above nose (landmark 0)
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

    // Draw unselected first, then selected on top
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
}

function leanBadgeColor(angle: number): string {
  if (angle >= 5 && angle <= 25) return 'green';
  if (angle > 35) return 'red';
  return 'yellow';
}

function leanBadgeLabel(angle: number): string {
  if (angle < 5) return 'upright';
  if (angle > 35) return 'over-lean';
  return 'ok';
}

export function PoseAnglesTable({ angles }: TableProps) {
  if (!angles) return null;

  const rows: { label: string; value: number; hint: string; badge?: React.ReactNode }[] = [
    {
      label: 'Torso lean',
      value: angles.torsoLean,
      hint: 'forward lean from vertical',
      badge: (
        <Badge size="xs" color={leanBadgeColor(angles.torsoLean)}>
          {leanBadgeLabel(angles.torsoLean)}
        </Badge>
      ),
    },
    { label: 'Right knee',  value: angles.rightKneeAngle,  hint: 'hip–knee–ankle' },
    { label: 'Left knee',   value: angles.leftKneeAngle,   hint: 'hip–knee–ankle' },
    { label: 'Right elbow', value: angles.rightElbowAngle, hint: 'shoulder–elbow–wrist' },
    { label: 'Left elbow',  value: angles.leftElbowAngle,  hint: 'shoulder–elbow–wrist' },
  ];

  return (
    <Table striped withTableBorder>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Joint</Table.Th>
          <Table.Th>Angle</Table.Th>
          <Table.Th>Note</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {rows.map(r => (
          <Table.Tr key={r.label}>
            <Table.Td><Text size="sm">{r.label}</Text></Table.Td>
            <Table.Td>
              <Group gap="xs">
                <Text size="sm" fw={600}>{r.value.toFixed(1)}°</Text>
                {r.badge}
              </Group>
            </Table.Td>
            <Table.Td><Text size="xs" c="dimmed">{r.hint}</Text></Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}
