import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn('flex flex-wrap items-center justify-between gap-3 pb-4', className)}>
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="truncate text-title">{title}</h1>
        {subtitle ? <p className="text-subtitle text-ink-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
