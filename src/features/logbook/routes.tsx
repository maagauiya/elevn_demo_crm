import type { RouteObject } from 'react-router';

/** Роуты фичи logbook внутри AppShell. Страницы грузятся лениво. */
export const logbookRoutes: RouteObject[] = [
  { path: 'logbook', lazy: async () => ({ Component: (await import('./pages/LogbookPage')).LogbookPage }) },
  { path: 'offices', lazy: async () => ({ Component: (await import('./pages/OfficesPage')).OfficesPage }) },
  { path: 'training', lazy: async () => ({ Component: (await import('./pages/TrainingPage')).TrainingPage }) },
  // Неделя по дням. В старом фронте пути были склеены (/id:id); в react-router параметр — целый сегмент.
  { path: 'id/:docId', lazy: async () => ({ Component: (await import('./pages/PeriodPage')).DoctorWeekPage }) },
  {
    path: 'office/:officeId/:number',
    lazy: async () => ({ Component: (await import('./pages/PeriodPage')).CabinetWeekPage }),
  },
  {
    path: 'training/:docId/:number',
    lazy: async () => ({ Component: (await import('./pages/PeriodPage')).TrainingWeekPage }),
  },
];
