import { Card, Text, Badge, Group, ActionIcon, Menu } from '@mantine/core';
import { IconDotsVertical, IconTrash, IconChartBar, IconVideo, IconChartLine } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { computeStats, formatTime } from '../../lib/compute';
import type { Run } from '../../types';

interface Props {
  run: Run;
  onDelete: () => void;
}

export function RunCard({ run, onDelete }: Props) {
  const navigate = useNavigate();
  const stats = computeStats(run);
  const totalLabel = stats.totalTime ? formatTime(stats.totalTime) : '—';

  return (
    <Card shadow="sm" radius="md" withBorder>
      <Group justify="space-between" mb="xs">
        <Text fw={600}>{run.name}</Text>
        <Menu>
          <Menu.Target>
            <ActionIcon variant="subtle"><IconDotsVertical size={16} /></ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item leftSection={<IconVideo size={14} />}
              onClick={() => navigate(`/annotate/${run.id}`)}>Annotate</Menu.Item>
            <Menu.Item leftSection={<IconChartBar size={14} />}
              onClick={() => navigate(`/stats/${run.id}`)}>Stats</Menu.Item>
            <Menu.Item leftSection={<IconChartLine size={14} />}
              onClick={() => navigate(`/analytics/${run.id}`)}>Analytics</Menu.Item>
            <Menu.Divider />
            <Menu.Item color="red" leftSection={<IconTrash size={14} />}
              onClick={onDelete}>Delete</Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
      <Group gap="xs">
        <Badge variant="light">{run.discipline}</Badge>
        <Text size="sm" c="dimmed">{run.date}</Text>
        <Text size="sm" fw={500} ml="auto">{totalLabel}</Text>
      </Group>
      {run.notes && <Text size="xs" c="dimmed" mt="xs" lineClamp={1}>{run.notes}</Text>}
    </Card>
  );
}
