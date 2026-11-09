import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Skeleton } from '@/shared/ui';
import { useClientHistory } from '../api/logbook-api';
import { NS } from '../i18n';

/** Последние и предстоящие записи клиента (WASGetClientAppList) со ссылкой в журнал на нужный день. */
export function ClientHistory({
  clientId,
  excludeId,
  onNavigate,
}: {
  clientId: number;
  excludeId?: number;
  onNavigate?: () => void;
}) {
  const { t } = useTranslation(NS);
  const navigate = useNavigate();
  const history = useClientHistory(clientId);
  if (history.isPending) return <Skeleton className="h-20" />;
  const list = (history.data ?? []).filter((a) => a.id !== excludeId);
  if (!list.length) return <p className="text-body text-ink-muted">{t('history.empty')}</p>;
  return (
    <ul className="flex flex-col divide-y divide-hairline">
      {list.map((app) => (
        <li key={app.id}>
          <button
            type="button"
            disabled={!app.at}
            onClick={() => {
              if (!app.at) return;
              onNavigate?.();
              void navigate(`/logbook?date=${app.at.date}&open=${app.id}`);
            }}
            className="flex w-full cursor-pointer flex-col gap-0.5 py-2 text-left hover:bg-canvas-sunken disabled:cursor-default"
            title={t('history.open')}
          >
            <span className="text-caption text-accent">
              {app.at ? `${app.at.date.split('-').reverse().join('.')} ${app.at.time}` : ''}
            </span>
            <span className="truncate text-body">{app.services || '—'}</span>
            <span className="truncate text-micro text-ink-muted">{app.doctorName}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
