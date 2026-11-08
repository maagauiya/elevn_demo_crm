import type { RouteObject } from 'react-router';

/** Роуты фичи billing внутри AppShell. Страницы грузятся лениво. */
export const billingRoutes: RouteObject[] = [
  { path: 'license', lazy: async () => ({ Component: (await import('./pages/LicensePage')).LicensePage }) },
  {
    path: 'license/legal',
    lazy: async () => ({ Component: (await import('./pages/LicenseLegalPage')).LicenseLegalPage }),
  },
  {
    path: 'license/physical',
    lazy: async () => ({ Component: (await import('./pages/LicensePhysicalPage')).LicensePhysicalPage }),
  },
  { path: 'license/buy', lazy: async () => ({ Component: (await import('./pages/LicenseBuyPage')).LicenseBuyPage }) },
];
