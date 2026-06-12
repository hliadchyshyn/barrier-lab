import { AppShell, Group, Text, Avatar, Menu, Button, Divider, Burger, Drawer, Stack, UnstyledButton, SegmentedControl } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { IconHome, IconArrowsLeftRight, IconTrendingUp, IconLogout, IconShield, IconHeart } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/auth';
import i18n from '../i18n';
import type { ReactElement } from 'react';

const LANG_KEY = 'barrier-lab-lang';

type NavItem =
  | { label: string; path: string; href?: never; icon: ReactElement; color?: string }
  | { label: string; path?: never; href: string; icon: ReactElement; color: string };

function externalLinkProps(item: NavItem) {
  if (!item.href) return {};
  return { component: 'a' as const, href: item.href, target: '_blank', rel: 'noopener noreferrer' };
}

function LangSwitch() {
  const { i18n: i18nHook } = useTranslation();
  const current = i18nHook.language.startsWith('uk') ? 'uk' : 'en';
  return (
    <SegmentedControl
      size="xs"
      value={current}
      onChange={(v) => {
        i18n.changeLanguage(v);
        localStorage.setItem(LANG_KEY, v);
      }}
      data={[
        { value: 'en', label: 'EN' },
        { value: 'uk', label: 'УК' },
      ]}
    />
  );
}

function UserMenu() {
  const { t } = useTranslation();
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
          {t('nav.signOut')}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

export function Layout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [drawerOpen, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);
  const user = useAuthStore(s => s.user);
  const isAdmin = user?.role === 'admin';

  const navItems: NavItem[] = [
    { label: t('nav.runs'),    path: '/',        icon: <IconHome size={18} /> },
    { label: t('nav.trends'),  path: '/trends',  icon: <IconTrendingUp size={18} /> },
    { label: t('nav.compare'), path: '/compare', icon: <IconArrowsLeftRight size={18} /> },
    ...(isAdmin ? [{ label: t('nav.admin'), path: '/admin', icon: <IconShield size={18} /> } as NavItem] : []),
    { label: t('nav.donate'), href: 'https://send.monobank.ua/chaZmHXiy', icon: <IconHeart size={18} />, color: 'pink' },
  ];

  const handleNav = (path: string) => {
    navigate(path);
    closeDrawer();
  };

  return (
      <AppShell header={{ height: 56 }} padding={{ base: 'sm', sm: 'md' }}>
          <AppShell.Header>
              <Group
                  h='100%'
                  px={{ base: 'sm', sm: 'md' }}
                  justify='space-between'
              >
                  <Text
                      fw={700}
                      size='lg'
                      c='blue'
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate('/')}
                  >
                      BarrierLab
                  </Text>

                  {/* Desktop nav */}
                  <Group gap='xs' visibleFrom='sm'>
                      {navItems.map((item) => (
                          <Button
                              key={item.path ?? item.href}
                              {...externalLinkProps(item)}
                              variant={item.href ? 'light' : pathname === item.path ? 'light' : 'subtle'}
                              color={item.color}
                              size='sm'
                              leftSection={item.icon}
                              onClick={item.path ? () => navigate(item.path!) : undefined}
                          >
                              {item.label}
                          </Button>
                      ))}
                      <Divider orientation='vertical' />
                      <LangSwitch />
                      <UserMenu />
                  </Group>

                  {/* Mobile: lang + avatar + burger */}
                  <Group gap='xs' hiddenFrom='sm'>
                      <LangSwitch />
                      <UserMenu />
                      <Burger
                          opened={drawerOpen}
                          onClick={openDrawer}
                          size='sm'
                      />
                  </Group>
              </Group>
          </AppShell.Header>

          {/* Mobile drawer */}
          <Drawer
              opened={drawerOpen}
              onClose={closeDrawer}
              title='BarrierLab'
              size='xs'
              position='right'
              hiddenFrom='sm'
          >
              <Stack gap='xs'>
                  {navItems.map((item) => (
                      <UnstyledButton
                          key={item.path ?? item.href}
                          {...externalLinkProps(item)}
                          onClick={item.path ? () => handleNav(item.path!) : undefined}
                          p='sm'
                          style={(theme) => ({
                              borderRadius: theme.radius.sm,
                              backgroundColor:
                                  item.path && pathname === item.path
                                      ? theme.colors.blue[0]
                                      : 'transparent',
                              color:
                                  item.href
                                      ? theme.colors[item.color ?? 'pink'][6]
                                      : item.path && pathname === item.path
                                          ? theme.colors.blue[7]
                                          : 'inherit',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              fontWeight: item.path && pathname === item.path ? 600 : 400,
                          })}
                      >
                          {item.icon}
                          {item.label}
                      </UnstyledButton>
                  ))}
              </Stack>
          </Drawer>

          <AppShell.Main>
              <Outlet />
          </AppShell.Main>
      </AppShell>
  );
}
