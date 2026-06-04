import { useState, useEffect, useRef } from 'react';
import { Stack, Title, Select, Group, Text, Divider } from '@mantine/core';
import { useRunsStore } from '../../store/runs';
import { computeStats, computeDelta } from '../../lib/compute';
import { loadVideoUrl } from '../../lib/videoStorage';
import { api } from '../../lib/apiClient';
import { DeltaTable } from './DeltaTable';
import { OverlayChart } from './OverlayChart';
import { SyncedVideoPlayers } from './SyncedVideoPlayers';

async function fetchVideoSrc(runId: string): Promise<string | null> {
  const opfs = await loadVideoUrl(runId);
  if (opfs) return opfs;
  try {
    const { url } = await api.get<{ url: string }>(`/api/runs/${runId}/video-url`);
    return url;
  } catch {
    return null;
  }
}

function revokeBlobUrl(url: string | null) {
  if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
}

export function ComparePage() {
  const { runs } = useRunsStore();
  const [idA, setIdA] = useState<string | null>(null);
  const [idB, setIdB] = useState<string | null>(null);
  const [srcA, setSrcA] = useState<string | null>(null);
  const [srcB, setSrcB] = useState<string | null>(null);
  const ownedA = useRef<string | null>(null);
  const ownedB = useRef<string | null>(null);

  const runA = runs.find(r => r.id === idA);
  const runB = runs.find(r => r.id === idB);
  const options = runs.map(r => ({ value: r.id, label: r.name }));

  const statsA = runA ? computeStats(runA) : null;
  const statsB = runB ? computeStats(runB) : null;
  const deltas = statsA && statsB ? computeDelta(statsA, statsB) : [];

  useEffect(() => {
    if (!idA) {
      revokeBlobUrl(ownedA.current);
      ownedA.current = null;
      setSrcA(null);
      return;
    }
    let cancelled = false;
    fetchVideoSrc(idA).then(url => {
      if (cancelled) { revokeBlobUrl(url); return; }
      revokeBlobUrl(ownedA.current);
      ownedA.current = url?.startsWith('blob:') ? url : null;
      setSrcA(url);
    });
    return () => { cancelled = true; };
  }, [idA]);

  useEffect(() => {
    if (!idB) {
      revokeBlobUrl(ownedB.current);
      ownedB.current = null;
      setSrcB(null);
      return;
    }
    let cancelled = false;
    fetchVideoSrc(idB).then(url => {
      if (cancelled) { revokeBlobUrl(url); return; }
      revokeBlobUrl(ownedB.current);
      ownedB.current = url?.startsWith('blob:') ? url : null;
      setSrcB(url);
    });
    return () => { cancelled = true; };
  }, [idB]);

  useEffect(() => () => {
    revokeBlobUrl(ownedA.current);
    revokeBlobUrl(ownedB.current);
  }, []);

  return (
    <Stack>
      <Title order={2}>Compare Runs</Title>
      <Group align="flex-end" grow wrap="wrap">
        <Select label="Run A" placeholder="Select run" data={options}
          value={idA} onChange={setIdA} style={{ minWidth: 140 }} />
        <Select label="Run B" placeholder="Select run" data={options}
          value={idB} onChange={setIdB} style={{ minWidth: 140 }} />
      </Group>

      {runA && runB ? (
        <>
          <SyncedVideoPlayers runA={runA} runB={runB} srcA={srcA} srcB={srcB} />
          <Divider />
          {deltas.length > 0 ? (
            <>
              <Text size="sm" c="dimmed">Green delta = Run B is faster. Red = Run B is slower.</Text>
              <OverlayChart deltas={deltas} nameA={runA.name} nameB={runB.name} />
              <DeltaTable deltas={deltas} />
            </>
          ) : (
            <Text c="dimmed" size="sm">Annotate both runs to see split comparison.</Text>
          )}
        </>
      ) : (
        <Text c="dimmed">Select two runs to compare their splits.</Text>
      )}
    </Stack>
  );
}
