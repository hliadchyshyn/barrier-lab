import { useRef, useCallback } from 'react';
import { Text, Group, Tooltip } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { FrameAnalysis, HurdlePhase } from './usePose';

interface PhaseSegment {
  phase: HurdlePhase;
  startTime: number;
  endTime: number;
}

function buildSegments(frames: FrameAnalysis[], duration: number): PhaseSegment[] {
  if (frames.length === 0) return [];
  const segments: PhaseSegment[] = [];
  let current: PhaseSegment = {
    phase: frames[0].phase,
    startTime: 0,
    endTime: frames[0].time,
  };
  for (const frame of frames) {
    if (frame.phase !== current.phase) {
      current.endTime = frame.time;
      segments.push(current);
      current = { phase: frame.phase, startTime: frame.time, endTime: frame.time };
    } else {
      current.endTime = frame.time;
    }
  }
  current.endTime = duration;
  segments.push(current);
  return segments;
}

const PHASE_COLOR: Record<HurdlePhase, string> = {
  running:   '#6c757d',
  approach:  '#339af0',
  clearance: '#fd7e14',
  descent:   '#20c997',
};

const PHASE_BG: Record<HurdlePhase, string> = {
  running:   'rgba(108,117,125,0.15)',
  approach:  'rgba(51,154,240,0.15)',
  clearance: 'rgba(253,126,20,0.15)',
  descent:   'rgba(32,201,151,0.15)',
};

interface Props {
  frames: FrameAnalysis[];
  duration: number;
  currentTime: number;
  onSeek: (t: number) => void;
}

export function PhaseTimeline({ frames, duration, currentTime, onSeek }: Props) {
  const { t } = useTranslation();
  const barRef = useRef<HTMLDivElement>(null);

  const segments = buildSegments(frames, duration);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const bar = barRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    onSeek(Math.max(0, Math.min(duration, ratio * duration)));
  }, [duration, onSeek]);

  if (frames.length === 0) return null;

  const cursorPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div>
      <Group gap="xs" mb={4} align="center">
        <Text size="xs" c="dimmed">{t('pose.phase.label')}:</Text>
        {(['running', 'approach', 'clearance', 'descent'] as HurdlePhase[]).map(p => (
          <Group key={p} gap={4} align="center">
            <div style={{ width: 10, height: 10, borderRadius: 2, background: PHASE_COLOR[p] }} />
            <Text size="xs" c="dimmed">{t(`pose.phase.${p}`)}</Text>
          </Group>
        ))}
      </Group>
      <div
        ref={barRef}
        onClick={handleClick}
        style={{
          position: 'relative',
          height: 22,
          borderRadius: 4,
          overflow: 'hidden',
          cursor: 'pointer',
          display: 'flex',
          background: '#2c2e33',
        }}
      >
        {segments.map((seg, i) => {
          const left = (seg.startTime / duration) * 100;
          const width = ((seg.endTime - seg.startTime) / duration) * 100;
          return (
            <Tooltip
              key={i}
              label={`${t(`pose.phase.${seg.phase}`)} ${seg.startTime.toFixed(1)}–${seg.endTime.toFixed(1)}s`}
              position="top"
              withArrow
            >
              <div
                style={{
                  position: 'absolute',
                  left: `${left}%`,
                  width: `${width}%`,
                  height: '100%',
                  background: PHASE_BG[seg.phase],
                  borderLeft: `2px solid ${PHASE_COLOR[seg.phase]}`,
                  boxSizing: 'border-box',
                }}
              />
            </Tooltip>
          );
        })}
        {/* Current time cursor */}
        <div
          style={{
            position: 'absolute',
            left: `${cursorPct}%`,
            top: 0,
            bottom: 0,
            width: 2,
            background: 'white',
            opacity: 0.8,
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
}
