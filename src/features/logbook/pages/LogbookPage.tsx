import { useTranslation } from 'react-i18next';
import { FilterChip } from '@/shared/ui';
import { useDay, useScheduleFilter } from '../api/logbook-api';
import { LogbookSidebar } from '../components/LogbookSidebar';
import { ScheduleScreen } from '../components/ScheduleScreen';
import { NS } from '../i18n';
import { appointmentItems, doctorColumns } from '../model/grid';
import { doctorOptions, useDayNav, useNow } from '../model/use-day-screen';
import { useLogbookState } from '../model/use-logbook-state';

/** Журнал записей по специалистам (тип пункта -1). */
export function LogbookPage() {
  const { t } = useTranslation(NS);
  const filters = useScheduleFilter();
  const state = useLogbookState(filters.data);
  const day = useDay(
    state.filter ? { date: state.apiDate, recId: state.filter.recId, recType: state.filter.recType } : null,
  );
  const { title, nav } = useDayNav(state.date, state.setDate);
  const now = useNow();

  const doctorsAll = day.data?.doctors ?? [];
  const appointments = day.data?.appointments ?? [];
  const busy = new Set(appointments.map((a) => a.doctorId));
  const doctors = state.onlyBusy ? doctorsAll.filter((d) => busy.has(d.id)) : doctorsAll;

  return (
    <ScheduleScreen
      title={title}
      subtitle={
        day.data
          ? `${t('doctors', { count: doctors.length })} · ${t('appointments', { count: appointments.length })}`
          : ''
      }
      nav={nav}
      density={state.density}
      onDensity={state.setDensity}
      toolbar={
        <FilterChip pressed={state.onlyBusy} onPressedChange={state.setOnlyBusy}>
          {t('onlyBusy')}
        </FilterChip>
      }
      sidebar={
        <LogbookSidebar
          date={state.date}
          onDate={state.setDate}
          filters={filters.data ?? []}
          filter={state.filter}
          onFilter={state.setFilter}
        />
      }
      query={{
        isError: filters.isError || day.isError,
        isReady: Boolean(day.data),
        refetch: () => void (filters.isError ? filters.refetch() : day.refetch()),
      }}
      columns={doctorColumns(doctors, state.apiDate)}
      items={appointmentItems(appointments, (a) => `d${a.doctorId}`)}
      now={now}
      doctors={doctorOptions(doctorsAll)}
      editable
      emptyTitle={t('emptyDay')}
      emptyHint={t('emptyHint')}
      defaultDate={state.apiDate}
    />
  );
}
