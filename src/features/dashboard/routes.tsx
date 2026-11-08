import type { RouteObject } from 'react-router';

/** Роуты фичи dashboard внутри AppShell. Страницы грузятся лениво. */
export const dashboardRoutes: RouteObject[] = [
  {
    path: 'dashboard/:itemId',
    lazy: async () => ({ Component: (await import('./pages/DashboardPage')).DashboardPage }),
  },
  { path: 'chart/:itemId', lazy: async () => ({ Component: (await import('./pages/ChartPage')).ChartPage }) },
];
