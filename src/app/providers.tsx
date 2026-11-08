import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { ReactNode } from 'react';
import { queryClient } from '@/shared/api';
import { Toaster, TooltipProvider } from '@/shared/ui';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={300}>
        {children}
        <Toaster />
      </TooltipProvider>
      {import.meta.env.DEV ? <ReactQueryDevtools buttonPosition="top-right" /> : null}
    </QueryClientProvider>
  );
}
