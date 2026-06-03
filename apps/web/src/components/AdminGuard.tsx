import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

export function AdminGuard() {
  const user = useAuthStore(s => s.user);
  const loading = useAuthStore(s => s.loading);

  if (loading) return null;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return <Outlet />;
}
