import type { RouteObject } from 'react-router';

/** Роуты фичи work-schedule внутри AppShell. Страницы грузятся лениво. */
export const workScheduleRoutes: RouteObject[] = [
  {
    path: 'work_schedule',
    lazy: async () => ({ Component: (await import('./pages/WorkSchedulePage')).WorkSchedulePage }),
  },
];
