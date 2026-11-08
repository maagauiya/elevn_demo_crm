import { Plus } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/cn';

/** FAB быстрой записи — единственный постоянно «поднятый» элемент (цветная тень accent). */
export function Fab({ label, className, children, ...props }: ComponentProps<'button'> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'fixed right-6 bottom-6 z-40 flex size-14 cursor-pointer items-center justify-center rounded-pill bg-accent text-on-accent shadow-fab transition-colors hover:bg-accent-hover',
        className,
      )}
      {...props}
    >
      {children ?? <Plus className="size-6" />}
    </button>
  );
}
