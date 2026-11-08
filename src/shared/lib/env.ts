/**
 * Флаги окружения. Выражения пишем прямо через import.meta.env, чтобы Vite подставил
 * значения при сборке и вырезал мёртвый код (моки, /dev/kit) из прод-бандла.
 */
export const env = {
  /** MSW-моки вместо бэкенда: только явно (pnpm dev:mocks, тесты, e2e в CI). По умолчанию — локальный бэкенд. */
  apiMocks: import.meta.env.VITE_API_MOCKS === 'true',
  /** Единый эндпоинт. В dev Vite проксирует /api.php на локальный бэкенд, в проде — nginx. */
  apiUrl: import.meta.env.VITE_API_URL ?? '/api.php',
  isDev: import.meta.env.DEV,
} as const;
