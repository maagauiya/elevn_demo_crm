import { FileQuestion, ServerCrash } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { isRouteErrorResponse, Link, useRouteError } from 'react-router';
import { Button, EmptyState, Panel } from '@/shared/ui';

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <Panel>
      <EmptyState
        icon={<FileQuestion />}
        title={t('errors.notFoundTitle')}
        description={t('errors.notFoundDescription')}
        action={
          <Button asChild variant="primary">
            <Link to="/">{t('errors.toHome')}</Link>
          </Button>
        }
      />
    </Panel>
  );
}

/** ErrorBoundary роута: падение одного экрана не роняет всё приложение. */
export function RouteErrorPage() {
  const { t } = useTranslation();
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />;
  if (import.meta.env.DEV) console.error(error);
  return (
    <div className="p-4">
      <Panel>
        <EmptyState
          icon={<ServerCrash className="text-danger" />}
          title={t('errors.unknownTitle')}
          description={t('errors.unknownDescription')}
          action={
            <Button
              variant="primary"
              onClick={() => {
                window.location.reload();
              }}
            >
              {t('actions.retry')}
            </Button>
          }
        />
      </Panel>
    </div>
  );
}
