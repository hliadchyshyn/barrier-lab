import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { AnnotatePage } from './features/annotate/AnnotatePage';
import { StatsPage } from './features/stats/StatsPage';
import { AnalyticsPage } from './features/analytics/AnalyticsPage';
import { TrendsPage } from './features/trends/TrendsPage';
import { ComparePage } from './features/compare/ComparePage';

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/',                   element: <DashboardPage /> },
      { path: '/annotate/:runId',    element: <AnnotatePage /> },
      { path: '/stats/:runId',       element: <StatsPage /> },
      { path: '/analytics/:runId',   element: <AnalyticsPage /> },
      { path: '/trends',             element: <TrendsPage /> },
      { path: '/compare',            element: <ComparePage /> },
    ],
  },
]);
