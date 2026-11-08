import { TrendingDown, TrendingUp } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { Panel } from './panel';

/** KPI-плитка дашборда. Плоская в покое, тень — только на hover/drag. */
export function KpiTile({
  label,
  value,
  delta,
  hint,
  icon,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  /** Изменение в процентах; знак определяет цвет и иконку */
  delta?: number;
  hint?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  const up = delta !== undefined && delta >= 0;
  return (
    <Panel interactive className={cn('flex flex-col gap-2 p-4', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-caption text-ink-muted">{label}</span>
        {icon ? <span className="text-ink-faint [&_svg]:size-4">{icon}</span> : null}
      </div>
      <span className="text-title">{value}</span>
      {delta !== undefined || hint ? (
        <div className="flex items-center gap-2 text-micro text-ink-muted">
          {delta !== undefined ? (
            <span className={cn('inline-flex items-center gap-1', up ? 'text-status-done-fg' : 'text-danger')}>
              {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              {up ? '+' : ''}
              {delta}%
            </span>
          ) : null}
          {hint}
        </div>
      ) : null}
    </Panel>
  );
}
