import { Copy, MessageCircle, Pencil, Printer, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { CallButton } from '@/features/telephony';
import { Button, SheetContent, StatusBadge } from '@/shared/ui';
import type { Appointment } from '../api/schemas';
import { NS } from '../i18n';
import { formatMinutes } from '../model/time';
import { ClientHistory } from './ClientHistory';

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-hairline py-3 last:border-0">
      <span className="text-caption text-ink-muted">{label}</span>
      <div className="text-body text-ink">{children}</div>
    </div>
  );
}

export type AppointmentAction = 'edit' | 'copy' | 'delete' | 'chat' | 'print';

/**
 * Карточка записи в шторке: данные, действия (изменить, копировать, удалить), записи клиента.
 * Серверные кнопки (AppButtonList) подключатся через генератор кнопок трека B.
 */
export function AppointmentSheet({
  appointment,
  doctorName,
  onAction,
  onClose,
}: {
  appointment: Appointment;
  doctorName: string | undefined;
  onAction: (action: AppointmentAction) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation(NS);
  const blocked = appointment.kind === 'blocked';
  return (
    <SheetContent title={appointment.clientName || t('details.title')}>
      <div className="flex flex-col px-5 py-2">
        <div className="flex flex-wrap items-center gap-2 py-3">
          {appointment.kind === 'blocked' ? (
            <span className="text-caption text-ink-muted">{t('blocked')}</span>
          ) : (
            <StatusBadge status={appointment.kind} />
          )}
          {appointment.statusName ? (
            <span className="text-caption text-ink-muted">{appointment.statusName}</span>
          ) : null}
          {appointment.online ? <span className="text-caption text-ink-muted">· {t('online')}</span> : null}
        </div>
        <div className="flex flex-wrap gap-2 pb-2">
          <Button
            size="sm"
            onClick={() => {
              onAction('edit');
            }}
          >
            <Pencil />
            {t('actions.edit')}
          </Button>
          {!blocked ? (
            <Button
              size="sm"
              onClick={() => {
                onAction('copy');
              }}
            >
              <Copy />
              {t('actions.copy')}
            </Button>
          ) : null}
          {appointment.clientPhone ? (
            <Button
              size="sm"
              onClick={() => {
                onAction('chat');
              }}
            >
              <MessageCircle />
              {t('chat')}
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              onAction('print');
            }}
          >
            <Printer />
            {t('print.appointment')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-danger hover:bg-danger-tint"
            onClick={() => {
              onAction('delete');
            }}
          >
            <Trash2 />
            {t('actions.delete')}
          </Button>
        </div>
        <Row label={t('details.time')}>
          {appointment.date ? `${appointment.date.split('-').reverse().join('.')}, ` : ''}
          {formatMinutes(appointment.start)}–{formatMinutes(appointment.end)}
        </Row>
        {doctorName ? <Row label={t('details.doctor')}>{doctorName}</Row> : null}
        {appointment.clientPhone ? (
          <Row label={t('details.phone')}>
            <CallButton phone={appointment.clientPhone} />
          </Row>
        ) : null}
        <Row label={t('details.services')}>
          {appointment.services.length ? (
            <ul className="list-disc pl-4">
              {appointment.services.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          ) : (
            <span className="text-ink-muted">{t('details.noServices')}</span>
          )}
        </Row>
        {appointment.comment ? <Row label={t('details.comment')}>{appointment.comment}</Row> : null}
        {appointment.cabinet ? <Row label={t('details.cabinet')}>{appointment.cabinet}</Row> : null}
        {appointment.assistant ? <Row label={t('details.assistant')}>{appointment.assistant}</Row> : null}
        {appointment.clientId !== null ? (
          <Row label={t('history.title')}>
            <ClientHistory clientId={appointment.clientId} excludeId={appointment.id} onNavigate={onClose} />
          </Row>
        ) : null}
      </div>
    </SheetContent>
  );
}
