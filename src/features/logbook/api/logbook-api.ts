import { keepPreviousData, type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/features/auth';
import { callApi } from '@/shared/api';
import {
  type Appointment,
  type Training,
  appointmentRowSchema,
  cabinetRowSchema,
  clientAppRowSchema,
  clientRowSchema,
  createAppRowSchema,
  docScheduleRowSchema,
  doctorRowSchema,
  filterRowSchema,
  resultRowSchema,
  serviceRowSchema,
  trainingRowSchema,
} from './schemas';

/** ScheduleType: 0 — по специалистам, 1 — по кабинетам. */
export const SCHEDULE_BY_DOCTORS = 0;
export const SCHEDULE_BY_CABINETS = 1;

export interface DayQuery {
  /** ISO-дата YYYY-MM-DD */
  date: string;
  recId: number;
  recType: number;
}

export const logbookKeys = {
  all: ['logbook'] as const,
  day: (q: DayQuery) => ['logbook', 'day', q] as const,
  cabinetsDay: (q: DayQuery) => ['logbook', 'cabinets-day', q] as const,
  trainingDay: (q: DayQuery) => ['logbook', 'training-day', q] as const,
  doctorPeriod: (doctorId: number, from: string, to: string) =>
    ['logbook', 'doctor-period', { doctorId, from, to }] as const,
  cabinetPeriod: (cabinetId: number, from: string, to: string, training: boolean) =>
    ['logbook', 'cabinet-period', { cabinetId, from, to, training }] as const,
};

export function useScheduleFilter(scheduleType = SCHEDULE_BY_DOCTORS) {
  const user = useCurrentUser();
  return useQuery({
    queryKey: ['logbook', 'filter', { userId: user.userId, scheduleType }],
    queryFn: ({ signal }) =>
      callApi(
        'WASGetFilter',
        { UserId: user.userId, IsWholeFilter: 1, ScheduleType: scheduleType },
        { schema: filterRowSchema, signal, checkRowResult: false },
      ),
    staleTime: Infinity,
  });
}

/** Специалисты и записи дня — одним запросом-парой: колонки без записей не мигают. */
export function useDay(query: DayQuery | null) {
  const user = useCurrentUser();
  return useQuery({
    queryKey: query ? logbookKeys.day(query) : ['logbook', 'day', 'idle'],
    enabled: query !== null,
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) => {
      if (!query) throw new Error('no query');
      const base = { UserId: user.userId, RecId: query.recId, RecType: query.recType, OPDate: query.date };
      const [doctors, appointments] = await Promise.all([
        callApi('WASGetDocList', base, { schema: doctorRowSchema, signal, checkRowResult: false }),
        callApi(
          'WASGetAppList',
          { ...base, ScheduleType: SCHEDULE_BY_DOCTORS },
          { schema: appointmentRowSchema, signal, checkRowResult: false },
        ),
      ]);
      return { doctors, appointments };
    },
  });
}

/** Расписание по кабинетам: колонки — кабинеты, записи раскладываются по CABINETID. */
export function useCabinetsDay(query: DayQuery | null) {
  const user = useCurrentUser();
  return useQuery({
    queryKey: query ? logbookKeys.cabinetsDay(query) : ['logbook', 'cabinets-day', 'idle'],
    enabled: query !== null,
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) => {
      if (!query) throw new Error('no query');
      const base = { UserId: user.userId, RecId: query.recId, RecType: query.recType };
      const [cabinets, appointments] = await Promise.all([
        callApi(
          'WASGetCabList',
          { ...base, OpDate: query.date },
          { schema: cabinetRowSchema, signal, checkRowResult: false },
        ),
        callApi(
          'WASGetAppList',
          { ...base, OPDate: query.date, ScheduleType: SCHEDULE_BY_CABINETS },
          { schema: appointmentRowSchema, signal, checkRowResult: false },
        ),
      ]);
      return { cabinets, appointments };
    },
  });
}

/** Групповые занятия: колонки — кабинеты, карточки — занятия (WASGetTrainingList). */
export function useTrainingDay(query: DayQuery | null) {
  const user = useCurrentUser();
  return useQuery({
    queryKey: query ? logbookKeys.trainingDay(query) : ['logbook', 'training-day', 'idle'],
    enabled: query !== null,
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) => {
      if (!query) throw new Error('no query');
      const base = { UserId: user.userId, RecId: query.recId, RecType: query.recType, OpDate: query.date };
      const [cabinets, trainings] = await Promise.all([
        callApi('WASGetCabList', base, { schema: cabinetRowSchema, signal, checkRowResult: false }),
        callApi('WASGetTrainingList', base, { schema: trainingRowSchema, signal, checkRowResult: false }),
      ]);
      return { cabinets, trainings };
    },
  });
}

/** Неделя одного специалиста: рабочие дни (WASGetDocSchedule) + записи за период (WASGetAppListDoc). */
export function useDoctorPeriod(doctorId: number, from: string, to: string) {
  const user = useCurrentUser();
  return useQuery({
    queryKey: logbookKeys.doctorPeriod(doctorId, from, to),
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) => {
      const [days, appointments] = await Promise.all([
        callApi(
          'WASGetDocSchedule',
          { DocId: doctorId, DateFrom: from, DateTo: to },
          { schema: docScheduleRowSchema, signal, checkRowResult: false },
        ),
        callApi(
          'WASGetAppListDoc',
          { UserId: user.userId, Doc_Id: doctorId, DateFrom: from, DateTo: to, ScheduleType: SCHEDULE_BY_DOCTORS },
          { schema: appointmentRowSchema, signal, checkRowResult: false },
        ),
      ]);
      const trainings: Training[] = [];
      return { days, appointments, trainings };
    },
  });
}

/** Неделя кабинета: рабочие дни + записи (или групповые занятия) за период. */
export function useCabinetPeriod(cabinetId: number, from: string, to: string, training: boolean) {
  const user = useCurrentUser();
  return useQuery({
    queryKey: logbookKeys.cabinetPeriod(cabinetId, from, to, training),
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) => {
      const period = { DateFrom: from, DateTo: to };
      const days = await callApi(
        'WASGetCabSchedule',
        { CabinetId: cabinetId, ...period },
        { schema: docScheduleRowSchema, signal, checkRowResult: false },
      );
      if (training) {
        const trainings = await callApi(
          'WASGetTrainingListCab',
          { UserId: user.userId, Cab_Id: cabinetId, ...period },
          { schema: trainingRowSchema, signal, checkRowResult: false },
        );
        const none: Appointment[] = [];
        return { days, appointments: none, trainings };
      }
      const appointments = await callApi(
        'WASGetAppListCab',
        { UserId: user.userId, Cab_Id: cabinetId, ...period, ScheduleType: SCHEDULE_BY_CABINETS },
        { schema: appointmentRowSchema, signal, checkRowResult: false },
      );
      const none: Training[] = [];
      return { days, appointments, trainings: none };
    },
  });
}

/** Специалисты дня (для выбора в диалогах там, где колонки — не специалисты). */
export function useDoctorsOfDay(query: DayQuery | null) {
  const user = useCurrentUser();
  return useQuery({
    queryKey: ['logbook', 'doctors', query],
    enabled: query !== null,
    staleTime: 60_000,
    queryFn: ({ signal }) =>
      callApi(
        'WASGetDocList',
        { UserId: user.userId, RecId: query?.recId, RecType: query?.recType, OPDate: query?.date },
        { schema: doctorRowSchema, signal, checkRowResult: false },
      ),
  });
}

export function useClientSearch(search: string) {
  const user = useCurrentUser();
  const term = search.trim();
  return useQuery({
    queryKey: ['logbook', 'clients', term],
    enabled: term.length >= 2,
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) =>
      callApi('WASGetClientList', { UserId: user.userId, SString: term }, { schema: clientRowSchema, signal }),
  });
}

export function useClientHistory(clientId: number | null) {
  const user = useCurrentUser();
  return useQuery({
    queryKey: ['logbook', 'client-history', { clientId }],
    enabled: clientId !== null,
    queryFn: ({ signal }) =>
      // Имя параметра — Userid (так в API_METHOD_PARAMS).
      callApi(
        'WASGetClientAppList',
        { Userid: user.userId, ClientId: clientId },
        { schema: clientAppRowSchema, signal },
      ),
  });
}

export function useDoctorServices(doctorId: number | null) {
  const user = useCurrentUser();
  return useQuery({
    queryKey: ['logbook', 'services', { doctorId }],
    enabled: doctorId !== null,
    staleTime: 5 * 60_000,
    queryFn: ({ signal }) =>
      callApi('WASGetManipList', { UserId: user.userId, DocId: doctorId }, { schema: serviceRowSchema, signal }),
  });
}

export interface CreateAppointmentInput {
  date: string;
  time: string;
  doctorId: number;
  clientId: number;
  cabinetId?: number;
  services: { id: number; price: number }[];
  comment: string;
}

export function useCreateAppointment() {
  const user = useCurrentUser();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateAppointmentInput) => {
      // ManipList: "ManId:Amount:Price:Tobepayed;…" — строгий порядок полей (как в старом фронте).
      const manipList = input.services.map((s) => [s.id, 1, s.price, s.price].join(':')).join(';');
      const [row] = await callApi(
        'WASCreateApp',
        {
          UserId: user.userId,
          App_ST: `${input.date} ${input.time}`,
          Doc_Id: input.doctorId,
          Client_Id: input.clientId,
          ManipList: manipList,
          AppComment: input.comment,
          CabinetId: input.cabinetId ?? 0,
          SPColorId: 0,
          IsCurDocRequired: 0,
        },
        { schema: createAppRowSchema, retry: false },
      );
      return row?.appointmentId ?? null;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: logbookKeys.all }),
  });
}

export interface UpdateAppointmentInput {
  appointment: Appointment;
  date: string;
  start: number;
  end: number;
  doctorId: number;
  /** undefined — не менять. Процедура игнорирует пустые параметры, пробел очищает комментарий. */
  comment?: string;
}

const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

/** Оптимистично переставляет запись во всех загруженных днях журнала. */
function patchAppointment(queryClient: QueryClient, id: number, patch: Partial<Appointment>) {
  queryClient.setQueriesData<{ appointments: Appointment[] }>({ queryKey: logbookKeys.all }, (data) => {
    if (!data || !Array.isArray(data.appointments)) return data;
    return { ...data, appointments: data.appointments.map((a) => (a.id === id ? { ...a, ...patch } : a)) };
  });
}

/**
 * WASUpdateApp. Отправляем только то, что меняем: пустые параметры процедура не трогает.
 * Время начала вне рабочего времени процедура молча не применяет — поэтому после ответа всегда перечитываем.
 */
export function useUpdateAppointment() {
  const user = useCurrentUser();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateAppointmentInput) => {
      const [row] = await callApi(
        'WASUpdateApp',
        {
          UserId: user.userId,
          App_Id: input.appointment.id,
          App_ST: `${input.date} ${hhmm(input.start)}`,
          App_ET: `${input.date} ${hhmm(input.end)}`,
          Doc_Id: input.doctorId,
          ...(input.comment !== undefined ? { AppComment: input.comment === '' ? ' ' : input.comment } : {}),
          IsManipUpdated: 0,
        },
        { schema: resultRowSchema, retry: false },
      );
      return row?.message ?? '';
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: logbookKeys.all });
      const snapshot = queryClient.getQueriesData({ queryKey: logbookKeys.all });
      patchAppointment(queryClient, input.appointment.id, {
        start: input.start,
        end: input.end,
        doctorId: input.doctorId,
        date: input.date,
        ...(input.comment !== undefined ? { comment: input.comment } : {}),
      });
      return { snapshot };
    },
    onError: (_error, _input, context) => {
      for (const [key, data] of context?.snapshot ?? []) queryClient.setQueryData(key, data);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: logbookKeys.all }),
  });
}

export function useDeleteAppointment() {
  const user = useCurrentUser();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const [row] = await callApi(
        'WASDeleteApp',
        { UserId: user.userId, App_Id: id, DeleteReason: reason },
        { schema: resultRowSchema, retry: false },
      );
      return row?.message ?? '';
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: logbookKeys.all }),
  });
}

export function useCopyAppointment() {
  const user = useCurrentUser();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: number; date: string; time: string; doctorId: number; cabinetId: number }) => {
      const [row] = await callApi(
        'WASCopyApp',
        {
          UserId: user.userId,
          Id: input.id,
          AppStart: `${input.date} ${input.time}`,
          DocId: input.doctorId,
          CabinetId: input.cabinetId,
        },
        { schema: createAppRowSchema, retry: false },
      );
      return row?.appointmentId ?? null;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: logbookKeys.all }),
  });
}
