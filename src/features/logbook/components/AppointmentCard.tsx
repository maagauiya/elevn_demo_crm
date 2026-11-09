import { useTranslation } from 'react-i18next';
import { STATUS_STYLES } from '@/shared/lib/appointment-status';
import { cn } from '@/shared/lib/cn';
import type { Appointment } from '../api/schemas';
import { NS } from '../i18n';
import { formatMinutes } from '../model/time';

/**
 * Карточка записи (design-system.md): закрашенный статус-тон + полоса 4px слева, плоско в покое,
 * тень hover-уровня при наведении. 30 мин — время + имя, от 45 мин — ещё и услуги.
 * Отменённая — зачёркнута (статус не только цветом). Нерабочее время — штриховка, без полосы.
 */
export function AppointmentCard({
  appointment,
  height,
  onOpen,
}: {
  appointment: Appointment;
  height: number;
  onOpen: () => void;
}) {
  const { t } = useTranslation(NS);
  const time = `${formatMinutes(appointment.start)}–${formatMinutes(appointment.end)}`;
  const label = `${time}, ${appointment.clientName || t('blocked')}${appointment.statusName ? `, ${appointment.statusName}` : ''}`;

  if (appointment.kind === 'blocked') {
    return (
      <button
        type="button"
        onClick={onOpen}
        aria-label={label}
        className="flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-sm bg-hatch px-1.5 py-1 text-left"
      >
        <span className="text-caption text-ink-faint">{time}</span>
        <span className="truncate text-micro text-ink-faint">{appointment.comment || t('blocked')}</span>
      </button>
    );
  }

  const style = STATUS_STYLES[appointment.kind];
  const roomy = appointment.end - appointment.start >= 45 && height >= 52;
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={label}
      title={label}
      className={cn(
        'flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-sm border-l-4 px-1.5 py-1 text-left transition-shadow hover:z-10 hover:shadow-hover',
        style.bg,
        style.stripe,
      )}
    >
      <span className="flex items-center gap-1">
        <span className={cn('text-caption', style.fg)}>{time}</span>
        {appointment.online ? (
          <span className="rounded-xs bg-canvas px-1 text-micro text-ink-muted">{t('online')}</span>
        ) : null}
      </span>
      <span className={cn('truncate text-label text-ink', style.strike && 'text-ink-muted line-through')}>
        {appointment.clientName || appointment.comment}
      </span>
      {roomy && appointment.services.length ? (
        <span className={cn('truncate text-body text-ink-muted', style.strike && 'line-through')}>
          {appointment.services.join(', ')}
        </span>
      ) : null}
    </button>
  );
}
