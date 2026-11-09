import { useTranslation } from 'react-i18next';
import { SCHEDULE_BY_CABINETS, useScheduleFilter, useTrainingDay } from '../api/logbook-api';
import { LogbookSidebar } from '../components/LogbookSidebar';
import { ScheduleScreen } from '../components/ScheduleScreen';
import { NS } from '../i18n';
import { cabinetColumns, trainingItems } from '../model/grid';
import { useDayNav, useNow } from '../model/use-day-screen';
import { useLogbookState } from '../model/use-logbook-state';

/**
 * Групповые занятия (тип пункта -100): колонки — кабинеты, карточки — занятия.
 * Создание занятий и запись клиентов на занятие — следующий шаг (формы журнала).
 */
export function TrainingPage() {
  const { t } = useTranslation(NS);
  const filters = useScheduleFilter(SCHEDULE_BY_CABINETS);
  const state = useLogbookState(filters.data);
  const day = useTrainingDay(
    state.filter ? { date: state.apiDate, recId: state.filter.recId, recType: state.filter.recType } : null,
  );
  const { title, nav } = useDayNav(state.date, state.setDate);
  const now = useNow();
  const trainings = day.data?.trainings ?? [];

  return (
    <ScheduleScreen
      title={title}
      subtitle={day.data ? t('trainings', { count: trainings.length }) : ''}
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
      columns={trainings.length ? cabinetColumns(day.data?.cabinets ?? [], state.apiDate) : []}
      items={trainingItems(trainings)}
      now={now}
      doctors={[]}
      editable={false}
      emptyTitle={t('training.empty')}
      emptyHint={t('training.emptyHint')}
      defaultDate={state.apiDate}
    />
  );
}
