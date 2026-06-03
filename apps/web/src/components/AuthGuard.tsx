import { useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { Center, Loader } from '@mantine/core';
import { useAuthStore } from '../store/auth';
import { migrateLocalRunsIfNeeded } from '../lib/localMigration';

export function AuthGuard() {
  const { user, loading, checkSession } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    checkSession().then(() => {
      const { user } = useAuthStore.getState();
      if (user) migrateLocalRunsIfNeeded();
    });
  }, [checkSession]);

  useEffect(() => {
    if (!loading && !user) navigate('/login', { replace: true });
  }, [loading, user, navigate]);

  if (loading) return <Center h="100vh"><Loader /></Center>;
  if (!user) return null;
  return <Outlet />;
}
