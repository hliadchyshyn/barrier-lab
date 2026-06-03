import { useEffect, useState, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Stack, Button, Group, Title, Divider, Alert, Text } from '@mantine/core';
import { useRunsStore } from '../../store/runs';
import { loadVideoUrl } from '../../lib/videoStorage';
import { api } from '../../lib/apiClient';
import { VideoPlayer } from './VideoPlayer';
import { AnnotationControls } from './AnnotationControls';
import { EventTimeline } from './EventTimeline';
import type { HurdleEvent } from '../../types';

export function AnnotatePage() {
  const { runId } = useParams<{ runId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { runs, updateRun } = useRunsStore();
  const run = runs.find(r => r.id === runId);

  const [events, setEvents]           = useState<HurdleEvent[]>(run?.events ?? []);
  const [videoSrc, setVideoSrc]       = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration]       = useState(0);
  const [seekTarget, setSeekTarget]   = useState<number | null>(null);

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
      // 1. OPFS — fast, works offline
      const opfsUrl = await loadVideoUrl(runId!);
      if (opfsUrl && mounted) {
        objectUrl = opfsUrl;
        setVideoSrc(opfsUrl);
        return;
      }
      // 2. R2 presigned URL — requires network
      try {
        const { url } = await api.get<{ url: string }>(`/api/runs/${runId}/video-url`);
        if (mounted) setVideoSrc(url);
      } catch {
        // no video available — player stays empty
      }
    }

    loadVideo();

    return () => {
      mounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [runId]);  // intentionally omits location.state — stable on mount

  const handleMark = useCallback((evt: HurdleEvent) => setEvents(prev => [...prev, evt]), []);
  const handleUndo = useCallback(() => setEvents(prev => prev.slice(0, -1)), []);

  const handleSave = async () => {
    if (!run) return;
    await updateRun(run.id, { events });
    navigate(`/stats/${run.id}`);
  };

  if (!run) return <div>Run not found</div>;

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>{run.name}</Title>
        <Button onClick={handleSave}>Save & View Stats</Button>
      </Group>

      {!videoSrc && (
        <Alert color="orange">
          <Text size="sm">Video not available. Re-upload it using "+ New Run" or select it below.</Text>
        </Alert>
      )}

      <VideoPlayer
        src={videoSrc}
        onTimeChange={setCurrentTime}
        onDurationChange={setDuration}
        seekToTime={seekTarget}
      />

      <EventTimeline
        events={events}
        duration={duration}
        currentTime={currentTime}
        onSeek={setSeekTarget}
      />

      <Divider />

      <AnnotationControls
        run={run}
        events={events}
        currentTime={currentTime}
        onMark={handleMark}
        onUndo={handleUndo}
      />
    </Stack>
  );
}
