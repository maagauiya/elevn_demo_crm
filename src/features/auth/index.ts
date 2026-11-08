// Публичный API фичи auth. Держим файл лёгким: без тяжёлых импортов.
export { authRoutes } from './routes';
export { RequireAuth } from './components/RequireAuth';
export { useSession, useCurrentUser, type Session } from './model/session-store';
export { useLogout } from './api/auth-api';
export type { SessionUser } from './api/schemas';
