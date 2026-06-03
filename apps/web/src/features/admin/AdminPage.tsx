import { useEffect, useState } from 'react';
import {
  Stack, Title, SimpleGrid, Paper, Text, Table, ActionIcon,
  Menu, Badge, Group, Alert, CopyButton, Button, Tooltip,
} from '@mantine/core';
import {
  IconTrash, IconKey, IconCopy, IconCheck, IconDotsVertical,
} from '@tabler/icons-react';
import { api } from '../../lib/apiClient';
import { useAuthStore } from '../../store/auth';

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  createdAt: string;
  runCount: number;
  videoCount: number;
};

type Stats = {
  totalUsers: number;
  totalRuns: number;
  videoCount: number;
};

export function AdminPage() {
  const currentUser = useAuthStore(s => s.user);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<AdminUser[]>('/api/admin/users'),
      api.get<Stats>('/api/admin/stats'),
    ]).then(([u, s]) => { setUsers(u); setStats(s); })
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load'));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this user and all their data?')) return;
    try {
      await api.delete(`/api/admin/users/${id}`);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch {
      setError('Failed to delete user');
    }
  };

  const handleResetPassword = async (id: string) => {
    try {
      const { resetUrl: url } = await api.post<{ resetUrl: string }>(
        `/api/admin/users/${id}/reset-password`, {}
      );
      setResetUrl(url);
    } catch {
      setError('Failed to generate reset link');
    }
  };

  return (
    <Stack>
      <Title order={2}>Admin Panel</Title>

      {error && (
        <Alert color="red" withCloseButton onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {resetUrl && (
        <Alert color="blue" withCloseButton onClose={() => setResetUrl(null)}
          title="Password reset link (valid 1 hour)">
          <Group gap="xs" wrap="wrap">
            <Text size="sm" style={{ wordBreak: 'break-all', flex: 1 }}>{resetUrl}</Text>
            <CopyButton value={resetUrl}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? 'Copied!' : 'Copy link'}>
                  <ActionIcon onClick={copy} variant="light" size="sm" color={copied ? 'teal' : 'blue'}>
                    {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
          </Group>
        </Alert>
      )}

      {stats && (
        <SimpleGrid cols={{ base: 2, sm: 3 }}>
          {[
            { label: 'Total Users',  value: stats.totalUsers },
            { label: 'Total Runs',   value: stats.totalRuns },
            { label: 'Videos in R2', value: stats.videoCount },
          ].map(({ label, value }) => (
            <Paper key={label} withBorder p="md" radius="md">
              <Text size="xs" c="dimmed">{label}</Text>
              <Title order={3}>{value}</Title>
            </Paper>
          ))}
        </SimpleGrid>
      )}

      <Paper withBorder radius="md" style={{ overflowX: 'auto' }}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>Role</Table.Th>
              <Table.Th>Runs</Table.Th>
              <Table.Th>Videos</Table.Th>
              <Table.Th>Joined</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {users.map(u => (
              <Table.Tr key={u.id}>
                <Table.Td>{u.name}</Table.Td>
                <Table.Td>{u.email}</Table.Td>
                <Table.Td>
                  <Badge color={u.role === 'admin' ? 'red' : 'blue'} variant="light">
                    {u.role ?? 'athlete'}
                  </Badge>
                </Table.Td>
                <Table.Td>{u.runCount}</Table.Td>
                <Table.Td>{u.videoCount}</Table.Td>
                <Table.Td>{new Date(u.createdAt).toLocaleDateString()}</Table.Td>
                <Table.Td>
                  <Menu>
                    <Menu.Target>
                      <ActionIcon
                        variant="subtle"
                        disabled={u.id === currentUser?.id}
                        aria-label="User actions"
                      >
                        <IconDotsVertical size={16} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        leftSection={<IconKey size={14} />}
                        onClick={() => handleResetPassword(u.id)}
                      >
                        Reset password
                      </Menu.Item>
                      <Menu.Divider />
                      <Menu.Item
                        color="red"
                        leftSection={<IconTrash size={14} />}
                        onClick={() => handleDelete(u.id)}
                      >
                        Delete user
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>
    </Stack>
  );
}
