import { useState, useEffect } from 'react';
import { Button, Stack, Title, Text, Modal, TextInput, Group, FileButton } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useRunsStore } from '../../store/runs';
import { RunCard } from './RunCard';
import { DisciplineSelect } from '../../components/DisciplineSelect';
import { DISCIPLINE_PRESETS } from '../../types';
import type { Discipline, Run } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { saveVideo, uploadVideoToR2 } from '../../lib/videoStorage';

export function DashboardPage() {
  const { t } = useTranslation();
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
    await saveVideo(id, videoFile);
    uploadVideoToR2(id, videoFile).catch(err =>
      console.error('R2 upload failed:', err),
    );
    navigate(`/annotate/${id}`, { state: { videoFile } });
    setModalOpen(false);
    setName('');
    setVideoFile(null);
  };

  return (
    <Stack>
      <Group justify="space-between" wrap="nowrap">
        <Title order={2}>{t('dashboard.title')}</Title>
        <Button onClick={() => setModalOpen(true)} size="sm" style={{ flexShrink: 0 }}>
          {t('dashboard.newRun')}
        </Button>
      </Group>

      {runs.length === 0 && (
        <Text c="dimmed">{t('dashboard.empty')}</Text>
      )}

      {runs.map(run => (
        <RunCard key={run.id} run={run} onDelete={() => deleteRun(run.id)} />
      ))}

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={t('dashboard.modalTitle')}>
        <Stack>
          <TextInput
            label={t('dashboard.runName')}
            placeholder={t('dashboard.runNamePlaceholder')}
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <DisciplineSelect value={discipline} onChange={setDiscipline} />
          <FileButton onChange={setVideoFile} accept="video/*">
            {props => (
              <Button variant="outline" {...props}>
                {videoFile ? videoFile.name : t('dashboard.selectVideo')}
              </Button>
            )}
          </FileButton>
          <Button disabled={!videoFile || !name.trim()} onClick={handleCreate}>
            {t('dashboard.create')}
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );
}
