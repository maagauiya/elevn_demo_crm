import { useTranslation } from 'react-i18next';
import { SCHEDULE_BY_CABINETS, useCabinetsDay, useDoctorsOfDay, useScheduleFilter } from '../api/logbook-api';
import { LogbookSidebar } from '../components/LogbookSidebar';
import { ScheduleScreen } from '../components/ScheduleScreen';
import { NS } from '../i18n';
import { appointmentItems, cabinetColumns } from '../model/grid';
import { doctorOptions, useDayNav, useNow } from '../model/use-day-screen';
import { useLogbookState } from '../model/use-logbook-state';

/** Расписание по кабинетам (тип пункта -10): колонки — кабинеты, записи по CABINETID. */
export function OfficesPage() {
  const { t } = useTranslation(NS);
  const filters = useScheduleFilter(SCHEDULE_BY_CABINETS);
  const state = useLogbookState(filters.data);
  const query = state.filter ? { date: state.apiDate, recId: state.filter.recId, recType: state.filter.recType } : null;
  const day = useCabinetsDay(query);
  const doctors = useDoctorsOfDay(query);
  const { title, nav } = useDayNav(state.date, state.setDate);
  const now = useNow();

  const cabinets = day.data?.cabinets ?? [];
  const appointments = day.data?.appointments ?? [];

  return (
    <ScheduleScreen
      title={title}
      subtitle={
        day.data
          ? `${t('cabinets', { count: cabinets.length })} · ${t('appointments', { count: appointments.length })}`
          : ''
      }
      nav={nav}
      density={state.density}
      onDensity={state.setDensity}
      sidebar={
        <LogbookSidebar
          date={state.date}
          onDate={state.setDate}
          filters={filters.data ?? []}
          filter={state.filter}
          onFilter={state.setFilter}
          filterLabel={t('offices.filter')}
        />
      }
      query={{
        isError: filters.isError || day.isError,
        isReady: Boolean(day.data),
        refetch: () => void (filters.isError ? filters.refetch() : day.refetch()),
      }}
      columns={cabinetColumns(cabinets, state.apiDate)}
      items={appointmentItems(appointments, (a) => `c${a.cabinetId}`)}
      now={now}
      doctors={doctorOptions(doctors.data ?? [])}
      editable
      emptyTitle={t('emptyCabinets')}
      emptyHint={t('emptyHint')}
      defaultDate={state.apiDate}
    />
  );
}
