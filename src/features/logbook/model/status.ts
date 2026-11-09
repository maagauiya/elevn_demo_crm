import type { AppointmentStatus } from '@/shared/lib/appointment-status';

/** Статус «нерабочее время» — не запись, а блокировка слота. */
export type CardKind = AppointmentStatus | 'blocked';

/**
 * AppStatusid (таблица MANIPULATIONSTATUS) → статус дизайн-системы.
 * Таблица соответствия — docs/design-system.md → «Статусы из базы».
 */
const BY_ID: Record<number, CardKind> = {
  1: 'pending',
  2: 'in-progress',
  3: 'done',
  4: 'cancelled',
  5: 'confirmed',
  6: 'confirmed',
  7: 'blocked',
  8: 'pending',
  9: 'done',
};

export function cardKindFromStatusId(id: number): CardKind {
  return BY_ID[id] ?? 'pending';
}
