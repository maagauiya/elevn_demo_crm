import type { Appointment, Cabinet, DaySchedule, Doctor, Training } from '../api/schemas';

/** Колонка сетки: специалист, кабинет или день недели. */
export interface GridColumn {
  key: string;
  title: string;
  subtitle: string;
  /** Ссылка из заголовка (например, на неделю специалиста) */
  href?: string;
  workFrom: number | null;
  workTo: number | null;
  /** Нерабочий день целиком (неделя специалиста) */
  off?: boolean;
  /** ISO-дата колонки */
  date: string;
  /** Что подставить в новую запись при клике по слоту */
  doctorId: number | null;
  cabinetId: number | null;
}

export type GridItem =
  | { kind: 'appointment'; id: number; columnKey: string; start: number; end: number; appointment: Appointment }
  | { kind: 'training'; id: number; columnKey: string; start: number; end: number; training: Training };

export const doctorColumns = (doctors: Doctor[], date: string): GridColumn[] =>
  doctors.map((d) => ({
    key: `d${d.id}`,
    title: d.name,
    subtitle: d.position,
    href: `/id/${d.id}?date=${date}&name=${encodeURIComponent(d.name)}`,
    workFrom: d.workFrom,
    workTo: d.workTo,
    date,
    doctorId: d.id,
    cabinetId: null,
  }));

export const cabinetColumns = (cabinets: Cabinet[], date: string): GridColumn[] =>
  cabinets.map((c) => ({
    key: `c${c.id}`,
    title: c.name,
    subtitle: c.capacity ? `${c.type} · ${c.capacity}` : c.type,
    workFrom: c.workFrom,
    workTo: c.workTo,
    date,
    doctorId: null,
    cabinetId: c.id,
  }));

export const weekColumns = (
  days: DaySchedule[],
  doctorId: number,
  label: (date: string) => [string, string],
): GridColumn[] =>
  days.map((d) => {
    const [title, subtitle] = label(d.date);
    return {
      key: d.date,
      title,
      subtitle,
      workFrom: d.workFrom,
      workTo: d.workTo,
      off: !d.working,
      date: d.date,
      doctorId,
      cabinetId: null,
    };
  });

export const appointmentItems = (appointments: Appointment[], columnOf: (a: Appointment) => string): GridItem[] =>
  appointments.map((a) => ({
    kind: 'appointment',
    id: a.id,
    columnKey: columnOf(a),
    start: a.start,
    end: a.end,
    appointment: a,
  }));

export const trainingItems = (trainings: Training[]): GridItem[] =>
  trainings.map((t) => ({
    kind: 'training',
    id: t.id,
    columnKey: `c${t.cabinetId}`,
    start: t.start,
    end: t.end,
    training: t,
  }));
