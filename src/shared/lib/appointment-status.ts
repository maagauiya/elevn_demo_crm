/** Единый справочник статусов записи. Цвета — только отсюда (см. design-system.md). */
export const APPOINTMENT_STATUSES = ['confirmed', 'in-progress', 'pending', 'done', 'cancelled'] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

interface StatusStyle {
  /** Заливка карточки */
  bg: string;
  /** Полоса слева / текст-акцент */
  fg: string;
  /** Граница-полоса слева */
  stripe: string;
  /** Отменённая запись дополнительно зачёркивается — статус не кодируется только цветом */
  strike: boolean;
}

export const STATUS_STYLES: Record<AppointmentStatus, StatusStyle> = {
  confirmed: {
    bg: 'bg-status-confirmed-bg',
    fg: 'text-status-confirmed-fg',
    stripe: 'border-l-status-confirmed-fg',
    strike: false,
  },
  'in-progress': {
    bg: 'bg-status-in-progress-bg',
    fg: 'text-status-in-progress-fg',
    stripe: 'border-l-status-in-progress-fg',
    strike: false,
  },
  pending: {
    bg: 'bg-status-pending-bg',
    fg: 'text-status-pending-fg',
    stripe: 'border-l-status-pending-fg',
    strike: false,
  },
  done: { bg: 'bg-status-done-bg', fg: 'text-status-done-fg', stripe: 'border-l-status-done-fg', strike: false },
  cancelled: {
    bg: 'bg-status-cancelled-bg',
    fg: 'text-status-cancelled-fg',
    stripe: 'border-l-status-cancelled-fg',
    strike: true,
  },
};
