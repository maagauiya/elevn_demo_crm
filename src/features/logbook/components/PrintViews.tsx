import { useTranslation } from 'react-i18next';
import { formatPhone } from '@/shared/lib/phone';
import type { Appointment } from '../api/schemas';
import { NS } from '../i18n';
import type { GridColumn, GridItem } from '../model/grid';
import { formatMinutes } from '../model/time';

/**
 * Печатный вид дня: таблица по колонкам (специалисты/кабинеты/дни), а не виртуализированная сетка.
 * Чёрно-белая печать: статус — текстом, отменённые зачёркнуты (design-system).
 */
export function PrintDay({
  title,
  subtitle,
  columns,
  items,
}: {
  title: string;
  subtitle: string;
  columns: GridColumn[];
  items: GridItem[];
}) {
  const { t } = useTranslation(NS);
  const byColumn = columns
    .map((column) => ({
      column,
      list: items
        .filter((i) => i.columnKey === column.key && i.kind === 'appointment')
        .sort((a, b) => a.start - b.start),
    }))
    .filter((g) => g.list.length);
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-title">{title}</h1>
        <p className="text-subtitle">{subtitle}</p>
      </header>
      {byColumn.map(({ column, list }) => (
        <section key={column.key} className="break-inside-avoid">
          <h2 className="border-b border-ink pb-1 text-label">
            {column.title}
            {column.subtitle ? <span className="text-subtitle"> · {column.subtitle}</span> : null}
          </h2>
          <table className="w-full border-collapse text-body">
            <thead>
              <tr className="text-left text-caption">
                <th className="w-24 py-1">{t('details.time')}</th>
                <th className="py-1">{t('details.client')}</th>
                <th className="w-36 py-1">{t('details.phone')}</th>
                <th className="py-1">{t('details.services')}</th>
                <th className="w-40 py-1">{t('details.status')}</th>
              </tr>
            </thead>
            <tbody>
              {list.map((item) => {
                const a = item.kind === 'appointment' ? item.appointment : null;
                if (!a) return null;
                const cancelled = a.kind === 'cancelled';
                return (
                  <tr
                    key={a.id}
                    className={cancelled ? 'border-t border-hairline line-through' : 'border-t border-hairline'}
                  >
                    <td className="py-1 align-top">
                      {formatMinutes(a.start)}–{formatMinutes(a.end)}
                    </td>
                    <td className="py-1 align-top">
                      {a.clientName || a.comment || t('blocked')}
                      {a.comment && a.clientName ? <div className="text-caption">{a.comment}</div> : null}
                    </td>
                    <td className="py-1 align-top">{a.clientPhone ? formatPhone(a.clientPhone) : ''}</td>
                    <td className="py-1 align-top">{a.services.join(', ')}</td>
                    <td className="py-1 align-top">{a.statusName ?? ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}

/** Талон записи для клиента. */
export function PrintSlip({
  appointment,
  date,
  doctorName,
}: {
  appointment: Appointment;
  date: string;
  doctorName: string | undefined;
}) {
  const { t } = useTranslation(NS);
  return (
    <div className="flex max-w-md flex-col gap-2 border border-ink p-4">
      <h1 className="text-title">{t('print.slip')}</h1>
      <p>
        <b>{t('details.time')}:</b> {date.split('-').reverse().join('.')}, {formatMinutes(appointment.start)}–
        {formatMinutes(appointment.end)}
      </p>
      <p>
        <b>{t('details.client')}:</b> {appointment.clientName}
      </p>
      {doctorName ? (
        <p>
          <b>{t('details.doctor')}:</b> {doctorName}
        </p>
      ) : null}
      {appointment.services.length ? (
        <p>
          <b>{t('details.services')}:</b> {appointment.services.join(', ')}
        </p>
      ) : null}
      {appointment.cabinet ? (
        <p>
          <b>{t('details.cabinet')}:</b> {appointment.cabinet}
        </p>
      ) : null}
    </div>
  );
}
