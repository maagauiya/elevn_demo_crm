import { createBrowserRouter, type RouteObject } from 'react-router';
import { authRoutes, RequireAuth } from '@/features/auth';
import { billingRoutes } from '@/features/billing';
import { dashboardRoutes } from '@/features/dashboard';
import { handbookRoutes } from '@/features/handbook';
import { kanbanRoutes } from '@/features/kanban';
import { logbookRoutes } from '@/features/logbook';
import { HomeRedirect } from '@/features/navigation';
import { workScheduleRoutes } from '@/features/work-schedule';
import { AppShell } from './layout/AppShell';
import { NotFoundPage, RouteErrorPage } from './pages/errors';

/**
 * Все роуты подключены заранее (фаза 0), поэтому треки не правят этот файл —
 * они меняют только routes.tsx своей фичи.
 */
export const routes: RouteObject[] = [
  ...authRoutes,
  {
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    errorElement: <RouteErrorPage />,
    children: [
      {
        errorElement: <RouteErrorPage />,
        children: [
          { index: true, element: <HomeRedirect /> },
          // Трек A: журнал, кабинеты, групповые занятия, график работы, графики и дашборды
          ...logbookRoutes,
          ...dashboardRoutes,
          ...workScheduleRoutes,
          // Трек B: движок таблиц (~180 разделов), канбан, лицензии
          ...handbookRoutes,
          ...kanbanRoutes,
          ...billingRoutes,
          ...(import.meta.env.DEV
            ? [{ path: 'dev/kit', lazy: async () => ({ Component: (await import('./pages/DevKitPage')).DevKitPage }) }]
            : []),
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
