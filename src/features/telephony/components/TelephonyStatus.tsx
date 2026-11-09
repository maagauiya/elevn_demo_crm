import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import { NS } from '../i18n';
import { useTelephony } from '../model/store';

/** Статус подключения к АТС одной строкой (для меню пользователя). */
export function TelephonyStatus() {
  const { t } = useTranslation(NS);
  const status = useTelephony((s) => s.status);
  if (status === 'off') return null;
  return (
    <span className="flex items-center gap-2 px-2 py-1.5 text-micro text-ink-muted">
      <span
        className={cn(
          'size-2 rounded-pill',
          status === 'connected' ? 'bg-status-done-fg' : status === 'connecting' ? 'bg-status-pending-fg' : 'bg-danger',
        )}
      />
      {t(`status.${status}`)}
      {import.meta.env.VITE_API_MOCKS === 'true' || import.meta.env.VITE_ATS_SIMULATOR === 'true'
        ? ` (${t('simulator')})`
        : ''}
    </span>
  );
}
