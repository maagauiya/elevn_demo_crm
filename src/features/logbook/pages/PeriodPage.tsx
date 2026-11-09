import { addDays, addWeeks, format, isSameWeek, startOfWeek } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams, useSearchParams } from 'react-router';
import { dateLocale } from '@/shared/lib/dates';
import { Button } from '@/shared/ui';
import { useCabinetPeriod, useDoctorPeriod } from '../api/logbook-api';
import type { DaySchedule } from '../api/schemas';
import { ScheduleScreen } from '../components/ScheduleScreen';
import { NS } from '../i18n';
import { appointmentItems, type GridItem, trainingItems, weekColumns } from '../model/grid';
import { fromApiDate, toApiDate } from '../model/time';
import { capitalize, useNow } from '../model/use-day-screen';
import { type Density } from '../model/use-logbook-state';
import { readStorage, writeStorage } from '@/shared/lib/storage';

type Source = 'doctor' | 'cabinet' | 'training';

/** Неделя по дням: специалист (/id/:docId), кабинет (/office/:officeId/:number), занятия кабинета (/training/:docId/:number). */
function PeriodScreen({ source, id, name }: { source: Source; id: number; name: string }) {
  const { t, i18n } = useTranslation(NS);
  const locale = dateLocale(i18n.language);
  const [params, setParams] = useSearchParams();
  const anchor = fromApiDate(params.get('date') ?? '') ?? new Date();
  const weekStart = startOfWeek(anchor, { weekStartsOn: 1 });
  const from = toApiDate(weekStart);
  const to = toApiDate(addDays(weekStart, 6));
  const [density, setDensityState] = useState<Density>(() =>
    readStorage<Density>('elevn.logbook.density') === 'comfort' ? 'comfort' : 'compact',
  );
  const now = useNow();

  const doctorPeriod = useDoctorPeriod(id, from, to);
  const cabinetPeriod = useCabinetPeriod(id, from, to, source === 'training');
  const period = source === 'doctor' ? doctorPeriod : cabinetPeriod;
  const data = period.data;

  // Бэкенд может не вернуть строку на каждый день — достраиваем неделю.
  const days: DaySchedule[] = Array.from({ length: 7 }, (_, i) => {
    const date = toApiDate(addDays(weekStart, i));
    return data?.days.find((d) => d.date === date) ?? { date, working: true, workFrom: null, workTo: null };
  });
  const columns = weekColumns(days, source === 'doctor' ? id : 0, (date) => {
    const d = fromApiDate(date) ?? weekStart;
    const day = days.find((x) => x.date === date);
    return [capitalize(format(d, 'EEEEEE, d MMM', { locale })), day && !day.working ? t('week.off') : ''];
  }).map((c) => (source === 'doctor' ? c : { ...c, doctorId: null, cabinetId: id }));

  const appointments = data?.appointments ?? [];
  const items: GridItem[] = [
    ...appointmentItems(appointments, (a) => a.date ?? from),
    ...trainingItems(data?.trainings ?? []).map((item) =>
      item.kind === 'training' ? { ...item, columnKey: item.training.date ?? from } : item,
    ),
  ];
  const setWeek = (date: Date) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('date', toApiDate(date));
        return next;
      },
      { replace: true },
    );
  };
  const range = `${format(weekStart, 'd MMM', { locale })} – ${format(addDays(weekStart, 6), 'd MMM yyyy', { locale })}`;

  return (
    <ScheduleScreen
      title={
        name ||
        t(source === 'doctor' ? 'week.title' : source === 'cabinet' ? 'week.cabinetTitle' : 'week.trainingTitle')
      }
      subtitle={`${range} · ${t('appointments', { count: items.length })}`}
      nav={{
        onPrev: () => {
          setWeek(addWeeks(weekStart, -1));
        },
        onNext: () => {
          setWeek(addWeeks(weekStart, 1));
        },
        onToday: () => {
          setWeek(new Date());
        },
        todayDisabled: isSameWeek(weekStart, new Date(), { weekStartsOn: 1 }),
        prevLabel: t('week.prev'),
        nextLabel: t('week.next'),
        todayLabel: t('week.thisWeek'),
      }}
      density={density}
      onDensity={(d) => {
        writeStorage('elevn.logbook.density', d);
        setDensityState(d);
      }}
      toolbar={
        <Button asChild size="sm" variant="ghost">
          <Link to={`/logbook?date=${toApiDate(anchor)}`}>
            <ArrowLeft />
            {t('week.back')}
          </Link>
        </Button>
      }
      query={{ isError: period.isError, isReady: Boolean(period.data), refetch: () => void period.refetch() }}
      columns={columns}
      items={items}
      now={now}
      doctors={source === 'doctor' ? [{ id, label: name }] : []}
      editable={source !== 'training'}
      emptyTitle={t('emptyDay')}
      emptyHint={t('emptyHint')}
      defaultDate={toApiDate(anchor)}
    />
  );
}

export function DoctorWeekPage() {
  const id = Number(useParams().docId);
  const [params] = useSearchParams();
  return <PeriodScreen key={id} source="doctor" id={id} name={params.get('name') ?? ''} />;
}

export function CabinetWeekPage() {
  const id = Number(useParams().officeId);
  return <PeriodScreen key={id} source="cabinet" id={id} name="" />;
}

export function TrainingWeekPage() {
  const id = Number(useParams().docId);
  return <PeriodScreen key={id} source="training" id={id} name="" />;
}
