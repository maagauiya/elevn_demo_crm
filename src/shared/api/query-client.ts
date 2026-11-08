import { QueryClient } from '@tanstack/react-query';
import { isApiError } from './errors';

/**
 * Соглашение о ключах: [feature, entity, params?], например ['logbook', 'appointments', { date }].
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Ошибки бизнес-логики и схемы повторять бессмысленно.
        if (isApiError(error) && (error.kind === 'server' || error.kind === 'schema')) return false;
        return failureCount < 2;
      },
    },
  },
});
