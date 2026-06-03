import { AppShell, NavLink, Group, Text } from '@mantine/core';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { IconHome, IconArrowsLeftRight, IconTrendingUp } from '@tabler/icons-react';

export function Layout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <AppShell header={{ height: 56 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Text fw={700} size="lg" c="blue">BarrierLab</Text>
          <Group>
            <NavLink label="Runs" leftSection={<IconHome size={16} />}
              active={pathname === '/'} onClick={() => navigate('/')} />
            <NavLink label="Trends" leftSection={<IconTrendingUp size={16} />}
              active={pathname === '/trends'} onClick={() => navigate('/trends')} />
            <NavLink label="Compare" leftSection={<IconArrowsLeftRight size={16} />}
              active={pathname === '/compare'} onClick={() => navigate('/compare')} />
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Main><Outlet /></AppShell.Main>
    </AppShell>
  );
}
