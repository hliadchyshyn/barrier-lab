import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AuthGuard } from './components/AuthGuard';
import { AdminGuard } from './components/AdminGuard';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { AnnotatePage } from './features/annotate/AnnotatePage';
import { StatsPage } from './features/stats/StatsPage';
import { AnalyticsPage } from './features/analytics/AnalyticsPage';
import { TrendsPage } from './features/trends/TrendsPage';
import { ComparePage } from './features/compare/ComparePage';
import { AdminPage } from './features/admin/AdminPage';

export const router = createBrowserRouter([
  { path: '/login',    element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    element: <AuthGuard />,
    children: [{
      element: <Layout />,
      children: [
        { path: '/',                 element: <DashboardPage /> },
        { path: '/annotate/:runId',  element: <AnnotatePage /> },
        { path: '/stats/:runId',     element: <StatsPage /> },
        { path: '/analytics/:runId', element: <AnalyticsPage /> },
        { path: '/trends',           element: <TrendsPage /> },
        { path: '/compare',          element: <ComparePage /> },
        { path: '/admin',            element: <AdminGuard><AdminPage /></AdminGuard> },
      ],
    }],
  },
]);
