import { AppShell, NavLink, Group, Text, Avatar, Menu } from '@mantine/core';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { IconHome, IconArrowsLeftRight, IconTrendingUp, IconLogout } from '@tabler/icons-react';
import { useAuthStore } from '../store/auth';

function UserMenu() {
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();
  return (
    <Menu>
      <Menu.Target>
        <Avatar src={null} radius="xl" size="sm" style={{ cursor: 'pointer' }}>
          {user?.name?.[0]?.toUpperCase() ?? '?'}
        </Avatar>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>{user?.email}</Menu.Label>
        <Menu.Item
          leftSection={<IconLogout size={14} />}
          onClick={async () => { await signOut(); navigate('/login'); }}
        >
          Sign out
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

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
            <UserMenu />
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Main><Outlet /></AppShell.Main>
    </AppShell>
  );
}
