import { Toggle } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/cn';

/** Filter-chip: hairline-граница, hover → canvas-sunken, выбранный — accent-tint. */
export function FilterChip({ className, ...props }: ComponentProps<typeof Toggle.Root>) {
  return (
    <Toggle.Root
      className={cn(
        'inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-pill border border-hairline bg-canvas px-3 text-caption text-ink transition-colors hover:bg-canvas-sunken data-[state=on]:border-accent data-[state=on]:bg-accent-tint data-[state=on]:text-accent [&_svg]:size-3.5',
        className,
      )}
      {...props}
    />
  );
}
