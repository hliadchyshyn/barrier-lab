import { AppShell, Group, Text, Avatar, Menu, Button, Divider, Burger, Drawer, Stack, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { IconHome, IconArrowsLeftRight, IconTrendingUp, IconLogout, IconShield, IconHeart } from '@tabler/icons-react';
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
  const [drawerOpen, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);
  const user = useAuthStore(s => s.user);
  const isAdmin = user?.role === 'admin';

  const navLinks = [
    { label: 'Runs',    path: '/',        icon: <IconHome size={18} /> },
    { label: 'Trends',  path: '/trends',  icon: <IconTrendingUp size={18} /> },
    { label: 'Compare', path: '/compare', icon: <IconArrowsLeftRight size={18} /> },
    ...(isAdmin ? [{ label: 'Admin', path: '/admin', icon: <IconShield size={18} /> }] : []),
  ];

  const handleNav = (path: string) => {
    navigate(path);
    closeDrawer();
  };

  return (
    <AppShell header={{ height: 56 }} padding={{ base: 'sm', sm: 'md' }}>
      <AppShell.Header>
        <Group h="100%" px={{ base: 'sm', sm: 'md' }} justify="space-between">
          <Text fw={700} size="lg" c="blue" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
            BarrierLab
          </Text>

          {/* Desktop nav */}
          <Group gap="xs" visibleFrom="sm">
            {navLinks.map(({ label, path, icon }) => (
              <Button
                key={path}
                variant={pathname === path ? 'light' : 'subtle'}
                size="sm"
                leftSection={icon}
                onClick={() => navigate(path)}
              >
                {label}
              </Button>
            ))}
            <Divider orientation="vertical" />
            <UserMenu />
            <Button
              component="a"
              href="https://buy.stripe.com/placeholder"
              target="_blank"
              rel="noopener noreferrer"
              variant="light"
              color="pink"
              size="sm"
              leftSection={<IconHeart size={16} />}
            >
              Donate
            </Button>
          </Group>

          {/* Mobile: avatar + burger */}
          <Group gap="xs" hiddenFrom="sm">
            <UserMenu />
            <Burger opened={drawerOpen} onClick={openDrawer} size="sm" />
          </Group>
        </Group>
      </AppShell.Header>

      {/* Mobile drawer */}
      <Drawer
        opened={drawerOpen}
        onClose={closeDrawer}
        title="BarrierLab"
        size="xs"
        position="right"
        hiddenFrom="sm"
      >
        <Stack gap="xs">
          {navLinks.map(({ label, path, icon }) => (
            <UnstyledButton
              key={path}
              onClick={() => handleNav(path)}
              p="sm"
              style={(theme) => ({
                borderRadius: theme.radius.sm,
                backgroundColor: pathname === path ? theme.colors.blue[0] : 'transparent',
                color: pathname === path ? theme.colors.blue[7] : 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontWeight: pathname === path ? 600 : 400,
              })}
            >
              {icon}
              {label}
            </UnstyledButton>
          ))}
          <UnstyledButton
            component="a"
            href="https://buy.stripe.com/placeholder"
            target="_blank"
            rel="noopener noreferrer"
            p="sm"
            style={(theme) => ({
              borderRadius: theme.radius.sm,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              color: theme.colors.pink[6],
            })}
          >
            <IconHeart size={18} />
            Donate
          </UnstyledButton>
        </Stack>
      </Drawer>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
