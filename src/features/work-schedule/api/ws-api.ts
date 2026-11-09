import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useCurrentUser } from '@/features/auth';
import { apiField, callApi } from '@/shared/api';
import { type CellRef, docDateLists, timeList } from '../model/selection';

const departmentSchema = z
  .object({ DEPID: apiField.int, DEPNAME: z.string() })
  .transform((r) => ({ id: r.DEPID, name: r.DEPNAME.trim() }));

const doctorSchema = z
  .object({ DOCID: apiField.int, DOCNAME: z.string(), DOCPOS: z.string().nullish() })
  .transform((r) => ({ id: r.DOCID, name: r.DOCNAME.trim(), position: r.DOCPOS?.trim() ?? '' }));

export type WsDoctor = z.output<typeof doctorSchema>;

const dayStatusSchema = z
  .object({
    DOCID: apiField.int,
    STATUSID: apiField.int,
    OPDATE: z.string(),
    TOOLTIP: z.string().nullish(),
    APPCOUNT: apiField.optionalString,
  })
  .transform((r) => ({
    docId: r.DOCID,
    statusId: r.STATUSID,
    date: r.OPDATE.trim(),
    hours: r.TOOLTIP?.trim() ?? '',
    appointments: r.APPCOUNT ? Number(r.APPCOUNT) : 0,
  }));

export type DayStatus = z.output<typeof dayStatusSchema>;

const statusSchema = z
  .object({ STATUSID: apiField.int, NAME: z.string(), WDETEDIT: apiField.bool })
  .transform((r) => ({ id: r.STATUSID, name: r.NAME.trim(), needsTime: r.WDETEDIT }));

export type WsStatus = z.output<typeof statusSchema>;

const optionSchema = z
  .object({ ID: apiField.int, NAME: z.string() })
  .transform((r) => ({ id: r.ID, name: r.NAME.trim() }));
const resultSchema = z
  .object({ RESULTDESCRIPTION: z.string().nullish() })
  .transform((r) => r.RESULTDESCRIPTION?.trim() ?? '');

export interface WsScope {
  companyId: number;
  depId: number;
  from: string;
  to: string;
}

const keys = {
  all: ['work-schedule'] as const,
  data: (s: WsScope) => ['work-schedule', 'data', s] as const,
};

/** Отделения филиала (WATTGetTree). «Весь филиал» — DepId = -1. */
export function useDepartments(companyId: number) {
  const user = useCurrentUser();
  return useQuery({
    queryKey: ['work-schedule', 'departments', { companyId }],
    staleTime: Infinity,
    queryFn: ({ signal }) =>
      callApi('WATTGetTree', { UserId: user.userId, CompanyId: companyId }, { schema: departmentSchema, signal }),
  });
}

/** Специалисты и статусы дней за период — одной парой запросов. */
export function useWorkSchedule(scope: WsScope | null) {
  const user = useCurrentUser();
  return useQuery({
    queryKey: scope ? keys.data(scope) : ['work-schedule', 'data', 'idle'],
    enabled: scope !== null,
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) => {
      if (!scope) throw new Error('no scope');
      const base = { UserId: user.userId, CompanyId: scope.companyId, DepId: scope.depId };
      const [doctors, days] = await Promise.all([
        callApi('WATTGetDoctorList', base, { schema: doctorSchema, signal }),
        callApi(
          'WATTGetTTData',
          { ...base, DateFrom: scope.from, DateTo: scope.to },
          { schema: dayStatusSchema, signal },
        ),
      ]);
      return { doctors, days };
    },
  });
}

export function useStatusList(companyId: number, depId: number) {
  const user = useCurrentUser();
  return useQuery({
    queryKey: ['work-schedule', 'statuses', { companyId, depId }],
    staleTime: Infinity,
    queryFn: ({ signal }) =>
      callApi(
        'WATTGetStatusList',
        { UserId: user.userId, CompanyId: companyId, DepId: depId },
        { schema: statusSchema, signal },
      ),
  });
}

export function useTemplates() {
  const user = useCurrentUser();
  return useQuery({
    queryKey: ['work-schedule', 'templates'],
    queryFn: ({ signal }) =>
      callApi('WATTGetTimeTableTemplateList', { UserId: user.userId }, { schema: optionSchema, signal }),
  });
}

/** Варианты периодов для копирования (PeriodType 0 — «откуда», 1 — «куда»). */
export function usePeriods(type: 0 | 1) {
  return useQuery({
    queryKey: ['work-schedule', 'periods', type],
    staleTime: Infinity,
    queryFn: ({ signal }) => callApi('WATTGetPeriodList', { PeriodType: type }, { schema: optionSchema, signal }),
  });
}

function useWsMutation<T>(run: (input: T, userId: number) => Promise<string>) {
  const user = useCurrentUser();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: T) => run(input, user.userId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: keys.all }),
  });
}

/** Статус (и часы для «Неполного дня») для выделенных ячеек — WATTSetStatusMultiple порциями по 500. */
export function useSetStatus() {
  return useWsMutation(
    async (input: { cells: CellRef[]; statusId: number; ranges: { from: string; to: string }[] }, userId) => {
      let message = '';
      for (const list of docDateLists(input.cells)) {
        const [row] = await callApi(
          'WATTSetStatusMultiple',
          {
            UserId: userId,
            DocDateList: list,
            StatusId: input.statusId,
            ...(input.ranges.length ? { TimeList: timeList(input.ranges) } : {}),
          },
          { schema: resultSchema, retry: false },
        );
        message = row ?? message;
      }
      return message;
    },
  );
}

export function useClearCells() {
  return useWsMutation(async (cells: CellRef[], userId) => {
    let message = '';
    for (const list of docDateLists(cells)) {
      // Имя параметра — DocdateList (так в API_METHOD_PARAMS).
      const [row] = await callApi(
        'WATTClearMultiple',
        { UserId: userId, DocdateList: list },
        { schema: resultSchema, retry: false },
      );
      message = row ?? message;
    }
    return message;
  });
}

export function useApplyTemplate() {
  return useWsMutation(async (input: { templateId: number; doctorIds: number[]; from: string; to: string }, userId) => {
    const [row] = await callApi(
      'WATTSetByTimeTableTemplate',
      {
        UserId: userId,
        TimeTableTemplateId: input.templateId,
        DoctorIList: input.doctorIds.join(','),
        DateFrom: input.from,
        DateTo: input.to,
      },
      { schema: resultSchema, retry: false },
    );
    return row ?? '';
  });
}

export function useSaveTemplate() {
  return useWsMutation(async (input: { name: string; cells: CellRef[] }, userId) => {
    // DayList: "docId,дата;docId,дата" по возрастанию даты (formatDayList старого фронта).
    const dayList = [...input.cells]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((c) => `${c.docId},${c.date}`)
      .join(';');
    const [row] = await callApi(
      'WATTAddTimeTableTemplate',
      { UserId: userId, Name: input.name, DayList: dayList },
      { schema: resultSchema, retry: false },
    );
    return row ?? '';
  });
}

export function useCopyPeriod() {
  return useWsMutation(async (input: { doctorIds: number[]; from: number; to: number }) => {
    const [row] = await callApi(
      'WATTCopyPeriod',
      { DoctoridList: input.doctorIds.join(','), PeriodFrom: input.from, PeriodTo: input.to },
      { schema: resultSchema, retry: false },
    );
    return row ?? '';
  });
}
