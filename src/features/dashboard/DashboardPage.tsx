import { useState, useEffect } from 'react';
import { Button, Stack, Title, Text, Modal, TextInput, Group, FileButton } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useRunsStore } from '../../store/runs';
import { RunCard } from './RunCard';
import { DisciplineSelect } from '../../components/DisciplineSelect';
import { DISCIPLINE_PRESETS } from '../../types';
import type { Discipline, Run } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export function DashboardPage() {
  const { runs, loaded, loadAll, addRun, deleteRun } = useRunsStore();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [discipline, setDiscipline] = useState<Discipline>('110m-hurdles');
  const [videoFile, setVideoFile] = useState<File | null>(null);

  useEffect(() => { if (!loaded) loadAll(); }, [loaded, loadAll]);

  const handleCreate = async () => {
    if (!videoFile || !name.trim()) return;
    const id = uuidv4();
    const preset = DISCIPLINE_PRESETS[discipline];
    const run: Run = {
      id, name: name.trim(), date: new Date().toISOString().slice(0, 10),
      discipline, hurdleCount: preset.hurdleCount,
      events: [], notes: '', createdAt: Date.now(),
    };
    await addRun(run);
    navigate(`/annotate/${id}`, { state: { videoFile } });
    setModalOpen(false);
    setName('');
    setVideoFile(null);
  };

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>My Runs</Title>
        <Button onClick={() => setModalOpen(true)}>+ New Run</Button>
      </Group>

      {runs.length === 0 && (
        <Text c="dimmed">No runs yet. Upload a video to get started.</Text>
      )}

      {runs.map(run => (
        <RunCard key={run.id} run={run} onDelete={() => deleteRun(run.id)} />
      ))}

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title="New Run">
        <Stack>
          <TextInput
            label="Run name"
            placeholder="Morning session, Heat 1..."
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <DisciplineSelect value={discipline} onChange={setDiscipline} />
          <FileButton onChange={setVideoFile} accept="video/*">
            {props => (
              <Button variant="outline" {...props}>
                {videoFile ? videoFile.name : 'Select video file'}
              </Button>
            )}
          </FileButton>
          <Button disabled={!videoFile || !name.trim()} onClick={handleCreate}>
            Create
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );
}
