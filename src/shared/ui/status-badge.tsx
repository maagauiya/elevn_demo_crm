import { useTranslation } from 'react-i18next';
import { type AppointmentStatus, STATUS_STYLES } from '@/shared/lib/appointment-status';
import { cn } from '@/shared/lib/cn';

/** Бейдж статуса записи. Цвет + текст (+ зачёркивание у отменённых) — статус не кодируется только цветом. */
export function StatusBadge({ status, className }: { status: AppointmentStatus; className?: string }) {
  const { t } = useTranslation();
  const style = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-xs px-1.5 py-0.5 text-caption',
        style.bg,
        style.fg,
        style.strike && 'line-through',
        className,
      )}
    >
      {t(`status.${status}`)}
    </span>
  );
}
