import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

interface Props {
  children: React.ReactNode;
}

export function AdminGuard({ children }: Props) {
  const user = useAuthStore(s => s.user);
  const loading = useAuthStore(s => s.loading);

  if (loading) return null;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}
