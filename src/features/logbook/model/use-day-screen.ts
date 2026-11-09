import { addDays, format, isToday } from 'date-fns';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { dateLocale } from '@/shared/lib/dates';
import type { Doctor } from '../api/schemas';
import type { DoctorOption } from '../components/AppointmentDialogs';
import type { ScheduleNav } from '../components/ScheduleScreen';
import { NS } from '../i18n';
import { toApiDate } from './time';

/** Текущая минута, обновляется раз в минуту (линия «сейчас»). */
export function useNow(): { date: string; minute: number } {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60_000);
    return () => {
      clearInterval(timer);
    };
  }, []);
  return { date: toApiDate(now), minute: now.getHours() * 60 + now.getMinutes() };
}

export function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Заголовок «Суббота, 21 июня 2025» и навигация по дням. */
export function useDayNav(date: Date, setDate: (d: Date) => void): { title: string; nav: ScheduleNav } {
  const { t, i18n } = useTranslation(NS);
  return {
    title: capitalize(format(date, 'EEEE, d MMMM yyyy', { locale: dateLocale(i18n.language) })),
    nav: {
      onPrev: () => {
        setDate(addDays(date, -1));
      },
      onNext: () => {
        setDate(addDays(date, 1));
      },
      onToday: () => {
        setDate(new Date());
      },
      todayDisabled: isToday(date),
      prevLabel: t('prevDay'),
      nextLabel: t('nextDay'),
      todayLabel: t('today'),
    },
  };
}

export const doctorOptions = (doctors: Doctor[]): DoctorOption[] =>
  doctors.map((d) => ({ id: d.id, label: d.position ? `${d.name} — ${d.position}` : d.name }));
