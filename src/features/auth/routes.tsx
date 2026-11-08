import type { RouteObject } from 'react-router';

/** Публичные роуты (вне AppShell). */
export const authRoutes: RouteObject[] = [
  { path: 'login', lazy: async () => ({ Component: (await import('./components/LoginPage')).LoginPage }) },
];
