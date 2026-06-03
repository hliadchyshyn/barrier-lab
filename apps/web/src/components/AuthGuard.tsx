import { useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { Center, Loader } from '@mantine/core';
import { useAuthStore } from '../store/auth';

export function AuthGuard() {
  const { user, loading, checkSession } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (!loading && !user) navigate('/login', { replace: true });
  }, [loading, user, navigate]);

  if (loading) return <Center h="100vh"><Loader /></Center>;
  if (!user) return null;
  return <Outlet />;
}
