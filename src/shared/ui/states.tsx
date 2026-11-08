import { AlertTriangle, Inbox } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import { Button } from './button';

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: {
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 px-4 py-12 text-center', className)}>
      <span className="text-ink-faint [&_svg]:size-8">{icon ?? <Inbox />}</span>
      <p className="text-label">{title ?? t('states.empty')}</p>
      {description ? <p className="max-w-sm text-body text-ink-muted">{description}</p> : null}
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  description,
  onRetry,
  className,
}: {
  description?: ReactNode;
  onRetry?: () => void;
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <div
      role="alert"
      className={cn('flex flex-col items-center justify-center gap-2 px-4 py-12 text-center', className)}
    >
      <AlertTriangle className="size-8 text-danger" />
      <p className="text-label">{t('states.error')}</p>
      {description ? <p className="max-w-sm text-body text-ink-muted">{description}</p> : null}
      {onRetry ? (
        <Button className="mt-2" onClick={onRetry}>
          {t('actions.retry')}
        </Button>
      ) : null}
    </div>
  );
}
