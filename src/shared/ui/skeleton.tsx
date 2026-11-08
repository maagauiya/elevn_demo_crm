import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/cn';

export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return <div aria-hidden className={cn('animate-pulse rounded-sm bg-hairline', className)} {...props} />;
}
