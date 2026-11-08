import type { RouteObject } from 'react-router';

/** Роуты фичи handbook внутри AppShell. Страницы грузятся лениво. */
export const handbookRoutes: RouteObject[] = [
  { path: 'info/:itemId', lazy: async () => ({ Component: (await import('./pages/HandbookPage')).HandbookPage }) },
];
