import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Stack, Button, Group, Title, Divider, Alert, Text,
  Collapse, ActionIcon, Loader, SegmentedControl, Progress, Center,
} from '@mantine/core';
import { IconChevronDown, IconChevronUp, IconRun, IconX } from '@tabler/icons-react';
import { useRunsStore } from '../../store/runs';
import { loadVideoUrl } from '../../lib/videoStorage';
import { api } from '../../lib/apiClient';
import { VideoPlayer } from './VideoPlayer';
import { AnnotationControls } from './AnnotationControls';
import { EventTimeline } from './EventTimeline';
import { PoseCanvas, PoseAnglesTable } from './PoseOverlay';
import { PhaseTimeline } from './PhaseTimeline';
import { usePose, frameAtTime } from './usePose';
import type { HurdleEvent } from '../../types';

export function AnnotatePage() {
  const { t } = useTranslation();
  const { runId } = useParams<{ runId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { runs, loaded, loadAll, updateRun } = useRunsStore();
  const run = runs.find(r => r.id === runId);

  useEffect(() => { if (!loaded) loadAll(); }, [loaded, loadAll]);

  const [events, setEvents]               = useState<HurdleEvent[]>(run?.events ?? []);
  const [videoSrc, setVideoSrc]           = useState<string | null>(null);
  const [currentTime, setCurrentTime]     = useState(0);
  const [duration, setDuration]           = useState(0);
  const [seekTarget, setSeekTarget]       = useState<number | null>(null);
  const [selectedEventIdx, setSelectedEventIdx] = useState<number | null>(null);
  const [poseOpen, setPoseOpen]           = useState(false);

  const videoElRef = useRef<HTMLVideoElement>(null);
  const {
    detectOnFrame, analyzeVideo, cancelAnalysis, clearPose, selectPose,
    loading: poseLoading,
    allLandmarks, selectedPoseIdx, angles, phase,
    videoFrames, isAnalyzingVideo, analysisProgress,
    error: poseError,
  } = usePose();

  // Derive displayed phase+angles: prefer video analysis data when available
  const frameData = videoFrames.length > 0 ? frameAtTime(videoFrames, currentTime) : null;
  const displayedAngles = frameData?.angles ?? angles;
  const displayedPhase  = frameData?.phase  ?? phase;

  useEffect(() => {
    const file: File | undefined = location.state?.videoFile;
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      return () => URL.revokeObjectURL(url);
    }

    if (!runId) return undefined;
    let mounted = true;
    let objectUrl: string | null = null;

    async function loadVideo() {
      const opfsUrl = await loadVideoUrl(runId!);
      if (opfsUrl && mounted) {
        objectUrl = opfsUrl;
        setVideoSrc(opfsUrl);
        return;
      }
      try {
        const { url } = await api.get<{ url: string }>(`/api/runs/${runId}/video-url`);
        if (mounted) setVideoSrc(url);
      } catch {
        // no video available
      }
    }

    loadVideo();

    return () => {
      mounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [runId]);

  const handleMark = useCallback((evt: HurdleEvent) => {
    setEvents(prev => [...prev, evt]);
    setSelectedEventIdx(null);
  }, []);

  const handleUndo = useCallback(() => {
    if (selectedEventIdx !== null) {
      setEvents(prev => prev.filter((_, i) => i !== selectedEventIdx));
      setSelectedEventIdx(null);
    } else {
      setEvents(prev => prev.slice(0, -1));
    }
  }, [selectedEventIdx]);

  const handleSelectEvent = useCallback((idx: number) => {
    setSelectedEventIdx(prev => prev === idx ? null : idx);
  }, []);

  const handleSave = async () => {
    if (!run) return;
    await updateRun(run.id, { events });
    navigate(`/stats/${run.id}`);
  };

  const handleAnalyzePose = useCallback(() => {
    const video = videoElRef.current;
    if (!video) return;
    detectOnFrame(video);
  }, [detectOnFrame]);

  const handleAnalyzeVideo = useCallback(() => {
    const video = videoElRef.current;
    if (!video) return;
    analyzeVideo(video);
  }, [analyzeVideo]);

  const handleTogglePose = useCallback(() => {
    if (poseOpen) {
      clearPose();
      setPoseOpen(false);
    } else {
      setPoseOpen(true);
    }
  }, [poseOpen, clearPose]);

  if (!loaded) return <Center p="xl"><Loader /></Center>;
  if (!run) return <div>{t('common.notFound')}</div>;

  return (
    <Stack>
      <Group justify="space-between" wrap="nowrap">
        <Title order={3} style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {run.name}
        </Title>
        <Button onClick={handleSave} size="sm" style={{ flexShrink: 0 }}>{t('annotate.saveStats')}</Button>
      </Group>

      {!videoSrc && (
        <Alert color="orange">
          <Text size="sm">{t('annotate.videoUnavailable')}</Text>
        </Alert>
      )}

      <div style={{ position: 'relative' }}>
        <VideoPlayer
          src={videoSrc}
          onTimeChange={setCurrentTime}
          onDurationChange={setDuration}
          seekToTime={seekTarget}
          videoElRef={videoElRef}
        />
        {poseOpen && (
          <PoseCanvas allLandmarks={allLandmarks} selectedPoseIdx={selectedPoseIdx} videoRef={videoElRef} />
        )}
      </div>

      {/* Phase timeline — visible after video analysis */}
      {videoFrames.length > 0 && (
        <PhaseTimeline
          frames={videoFrames}
          duration={duration}
          currentTime={currentTime}
          onSeek={setSeekTarget}
        />
      )}

      <EventTimeline
        events={events}
        duration={duration}
        currentTime={currentTime}
        onSeek={setSeekTarget}
        selectedEventIdx={selectedEventIdx}
        onSelectEvent={handleSelectEvent}
      />

      <Divider />

      <AnnotationControls
        run={run}
        events={events}
        currentTime={currentTime}
        onMark={handleMark}
        onUndo={handleUndo}
        selectedEventIdx={selectedEventIdx}
      />

      <Divider />

      <Group justify="space-between" align="center">
        <Group gap="xs">
          <IconRun size={18} />
          <Text fw={500} size="sm">{t('annotate.poseAnalysis')}</Text>
          <Text size="xs" c="dimmed">{t('annotate.poseHint')}</Text>
        </Group>
        <ActionIcon onClick={handleTogglePose} variant="subtle">
          {poseOpen ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
        </ActionIcon>
      </Group>

      <Collapse expanded={poseOpen}>
        <Stack gap="sm">
          {/* Analysis progress bar */}
          {isAnalyzingVideo && (
            <Stack gap={4}>
              <Group justify="space-between">
                <Text size="xs" c="dimmed">{t('annotate.analyzingVideo')} {Math.round(analysisProgress * 100)}%</Text>
                <ActionIcon size="xs" variant="subtle" color="red" onClick={cancelAnalysis}>
                  <IconX size={12} />
                </ActionIcon>
              </Group>
              <Progress value={analysisProgress * 100} animated size="sm" />
            </Stack>
          )}

          <Group gap="xs" wrap="wrap">
            {/* Single frame analysis */}
            <Button
              size="xs"
              variant="default"
              leftSection={poseLoading ? <Loader size="xs" /> : undefined}
              onClick={handleAnalyzePose}
              disabled={!videoSrc || poseLoading || isAnalyzingVideo}
            >
              {poseLoading ? t('annotate.loadingModel') : t('annotate.analyzeFrame')}
            </Button>

            {/* Full video analysis */}
            <Button
              size="xs"
              leftSection={isAnalyzingVideo ? <Loader size="xs" /> : undefined}
              onClick={handleAnalyzeVideo}
              disabled={!videoSrc || poseLoading || isAnalyzingVideo}
            >
              {t('annotate.analyzeVideo')}
            </Button>

            {videoFrames.length > 0 && !isAnalyzingVideo && (
              <Text size="xs" c="green">
                {t('annotate.analysisReady', { count: videoFrames.length })}
              </Text>
            )}
          </Group>

          {poseError && <Text size="xs" c="red">{poseError}</Text>}

          {allLandmarks && allLandmarks.length > 1 && (
            <Group gap="xs" align="center">
              <Text size="xs" c="dimmed">{t('annotate.athlete')}</Text>
              <SegmentedControl
                size="xs"
                value={String(selectedPoseIdx)}
                onChange={v => selectPose(Number(v))}
                data={allLandmarks.map((_, i) => ({ label: `${i + 1}`, value: String(i) }))}
              />
            </Group>
          )}

          <PoseAnglesTable angles={displayedAngles} phase={displayedPhase} />
        </Stack>
      </Collapse>
    </Stack>
  );
}
