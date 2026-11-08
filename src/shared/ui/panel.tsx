import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/cn';

/** Панель/карточка: плоско в покое (hairline), без тени. */
export function Panel({ className, interactive = false, ...props }: ComponentProps<'div'> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-md border border-hairline bg-canvas',
        interactive && 'cursor-pointer transition-shadow hover:shadow-hover',
        className,
      )}
      {...props}
    />
  );
}
