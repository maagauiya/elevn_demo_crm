import { z } from 'zod';
import { apiField } from '@/shared/api';
import { cardKindFromStatusId } from '../model/status';
import { parseSubject, splitClientName } from '../model/subject';
import { parseBackendDateTime, toMinutes } from '../model/time';

/** WASGetFilter: филиалы и подразделения. С HASDETAILS = 1 выбирается деталь (подразделение). */
export const filterRowSchema = z
  .object({
    RECID: apiField.int,
    RECTYPE: apiField.int,
    RECNAME: z.string(),
    HASDETAILS: apiField.bool,
    DETRECID: apiField.optionalString,
    DETRECTYPE: apiField.optionalString,
    DETRECNAME: apiField.optionalString,
  })
  .transform((row) =>
    row.HASDETAILS && row.DETRECID
      ? {
          recId: Number(row.DETRECID),
          recType: Number(row.DETRECTYPE),
          label: (row.DETRECNAME ?? '').trim(),
          group: row.RECNAME.trim(),
        }
      : { recId: row.RECID, recType: row.RECTYPE, label: row.RECNAME.trim(), group: null },
  );

export type FilterOption = z.output<typeof filterRowSchema>;

/** WASGetDocList: специалисты, работающие в выбранный день. */
export const doctorRowSchema = z
  .object({
    DOCID: apiField.int,
    DOCNAME: z.string(),
    DOCPOSITION: z.string().nullish(),
    DOCPHOTO: z.string().nullish(),
    COMPWORKTIMEFROM: apiField.optionalString,
    COMPWORKTIMETO: apiField.optionalString,
  })
  .transform((row) => ({
    id: row.DOCID,
    name: row.DOCNAME.trim(),
    position: row.DOCPOSITION?.trim() ?? '',
    workFrom: row.COMPWORKTIMEFROM ? toMinutes(row.COMPWORKTIMEFROM) : null,
    workTo: row.COMPWORKTIMETO ? toMinutes(row.COMPWORKTIMETO) : null,
  }));

export type Doctor = z.output<typeof doctorRowSchema>;

/** WASGetAppList: записи на день. */
export const appointmentRowSchema = z
  .object({
    APPID: apiField.int,
    APPST: z.string(),
    APPET: z.string(),
    APPSUB: z.string().nullish(),
    DOCID: apiField.int,
    APPSTATUSID: apiField.int,
    APPCOMMENT: z.string().nullish(),
    APPDATE: apiField.optionalString,
    CABINETID: apiField.optionalString,
    CLIENTID: apiField.optionalString,
    CLIENTNAME: z.string().nullish(),
    ISYAOR: apiField.bool,
    CABINETNUMBER: apiField.optionalString,
    WASSISTANT: apiField.bool,
    ASSISTANTNAME: apiField.optionalString,
  })
  .transform((row) => {
    const { services, statusName } = parseSubject(row.APPSUB ?? '');
    const client = splitClientName(row.CLIENTNAME ?? '');
    return {
      id: row.APPID,
      /** Есть только в ответах за период (неделя специалиста, кабинет) */
      date: row.APPDATE,
      doctorId: row.DOCID,
      cabinetId: row.CABINETID ? Number(row.CABINETID) : 0,
      start: toMinutes(row.APPST),
      // Настоящее окончание; если бэкенд прислал end <= start — считаем 15 минут. Минимальную высоту даёт карточка.
      end: toMinutes(row.APPET) > toMinutes(row.APPST) ? toMinutes(row.APPET) : toMinutes(row.APPST) + 15,
      statusId: row.APPSTATUSID,
      kind: cardKindFromStatusId(row.APPSTATUSID),
      statusName,
      clientId: row.CLIENTID && row.CLIENTID !== '0' ? Number(row.CLIENTID) : null,
      clientName: client.name,
      clientPhone: client.phone,
      services,
      comment: row.APPCOMMENT?.trim() ?? '',
      online: row.ISYAOR,
      cabinet: row.CABINETNUMBER && row.CABINETNUMBER !== '0' ? row.CABINETNUMBER : null,
      assistant: row.WASSISTANT ? row.ASSISTANTNAME : null,
    };
  });

export type Appointment = z.output<typeof appointmentRowSchema>;

/** WASGetClientList: поиск клиента по строке. */
export const clientRowSchema = z
  .object({
    CLIENTID: apiField.int,
    SURNAME: z.string().nullish(),
    NAME: z.string().nullish(),
    SECONDNAME: z.string().nullish(),
    CELLPHONE: z.string().nullish(),
    CARDNUMBER: z.string().nullish(),
  })
  .transform((row) => ({
    id: row.CLIENTID,
    name: [row.SURNAME, row.NAME, row.SECONDNAME]
      .map((part) => part?.trim())
      .filter(Boolean)
      .join(' '),
    phone: row.CELLPHONE?.trim() ?? '',
    card: row.CARDNUMBER?.trim() ?? '',
  }));

export type Client = z.output<typeof clientRowSchema>;

/** WASGetManipList: услуги специалиста для добавления в запись. */
export const serviceRowSchema = z
  .object({
    MID: apiField.int,
    MNAME: z.string(),
    MPRICE: z.string().nullish(),
    MGNAME: z.string().nullish(),
  })
  .transform((row) => ({
    id: row.MID,
    name: row.MNAME.trim(),
    price: Number((row.MPRICE ?? '0').replace(',', '.')) || 0,
    group: row.MGNAME?.trim() ?? '',
  }));

export type Service = z.output<typeof serviceRowSchema>;

/** WASCreateApp: RESULT/RESULTDESCRIPTION проверяет callApi. */
export const createAppRowSchema = z.object({ NAPPID: apiField.optionalString }).transform((row) => ({
  appointmentId: row.NAPPID ? Number(row.NAPPID) : null,
}));

/** WASGetCabList: кабинеты (колонки расписания по кабинетам и групповых занятий). */
export const cabinetRowSchema = z
  .object({
    ID: apiField.int,
    NAME: z.string(),
    CAPACITY: apiField.optionalString,
    CABTYPENAME: apiField.optionalString,
    COMPWORKTIMEFROM: apiField.optionalString,
    COMPWORKTIMETO: apiField.optionalString,
  })
  .transform((row) => ({
    id: row.ID,
    name: row.NAME.trim(),
    type: row.CABTYPENAME?.trim() ?? '',
    capacity: row.CAPACITY ? Number(row.CAPACITY) : null,
    workFrom: row.COMPWORKTIMEFROM ? toMinutes(row.COMPWORKTIMEFROM) : null,
    workTo: row.COMPWORKTIMETO ? toMinutes(row.COMPWORKTIMETO) : null,
  }));

export type Cabinet = z.output<typeof cabinetRowSchema>;

/** WASGetTrainingList: групповые занятия дня. */
export const trainingRowSchema = z
  .object({
    TRAININGID: apiField.int,
    TRAININGST: z.string(),
    TRAININGET: z.string(),
    TRAININGSUB: z.string().nullish(),
    DOCID: apiField.int,
    CABINETID: apiField.int,
    DOCTORNAME: z.string().nullish(),
    MAXCLIENTCOUNT: apiField.optionalString,
    MANIPULATIONSTATUSID: apiField.optionalString,
    TRAININGDATE: apiField.optionalString,
  })
  .transform((row) => ({
    id: row.TRAININGID,
    /** Есть только в ответе за период (WASGetTrainingListCab) */
    date: row.TRAININGDATE ? (parseBackendDateTime(row.TRAININGDATE)?.date ?? null) : null,
    start: toMinutes(row.TRAININGST),
    end:
      toMinutes(row.TRAININGET) > toMinutes(row.TRAININGST)
        ? toMinutes(row.TRAININGET)
        : toMinutes(row.TRAININGST) + 15,
    title: (row.TRAININGSUB ?? '').split('\n')[0]?.trim() ?? '',
    subject: row.TRAININGSUB?.trim() ?? '',
    doctorId: row.DOCID,
    doctorName: row.DOCTORNAME?.trim() ?? '',
    cabinetId: row.CABINETID,
    capacity: row.MAXCLIENTCOUNT ? Number(row.MAXCLIENTCOUNT) : null,
    kind: cardKindFromStatusId(Number(row.MANIPULATIONSTATUSID ?? 1)),
  }));

export type Training = z.output<typeof trainingRowSchema>;

/** WASGetCabSchedule: рабочие дни кабинета на период (те же поля, что у специалиста). */
/** WASGetDocSchedule: рабочие дни специалиста на период. */
export const docScheduleRowSchema = z
  .object({
    CHECKDATE: z.string(),
    ISWORKDATE: apiField.bool,
    COMPWORKTIMEFROM: apiField.optionalString,
    COMPWORKTIMETO: apiField.optionalString,
  })
  .transform((row) => ({
    date: row.CHECKDATE,
    working: row.ISWORKDATE,
    workFrom: row.COMPWORKTIMEFROM ? toMinutes(row.COMPWORKTIMEFROM) : null,
    workTo: row.COMPWORKTIMETO ? toMinutes(row.COMPWORKTIMETO) : null,
  }));

export type DaySchedule = z.output<typeof docScheduleRowSchema>;

/** WASGetClientAppList: 2 последних оплаченных и до 10 предстоящих записей клиента. */
export const clientAppRowSchema = z
  .object({
    APPID: apiField.int,
    APPDATE: z.string(),
    DOCTORNAME: z.string().nullish(),
    DOCTORID: apiField.optionalString,
    MANIPLIST: z.string().nullish(),
    VISITSUMMA: apiField.optionalString,
    APPTYPE: apiField.optionalString,
  })
  .transform((row) => ({
    id: row.APPID,
    /** Процедура отдаёт «21.06.2025 14:30» — нормализуем в ISO */
    at: parseBackendDateTime(row.APPDATE),
    doctorName: row.DOCTORNAME?.trim() ?? '',
    doctorId: row.DOCTORID ? Number(row.DOCTORID) : null,
    services: row.MANIPLIST?.trim() ?? '',
    amount: row.VISITSUMMA ? Number(row.VISITSUMMA.replace(',', '.')) || 0 : null,
    type: row.APPTYPE,
  }));

export type ClientApp = z.output<typeof clientAppRowSchema>;

/** Ответы изменяющих методов: RESULT/RESULTDESCRIPTION проверяет callApi. */
export const resultRowSchema = z.object({ RESULTDESCRIPTION: z.string().nullish() }).transform((row) => ({
  message: row.RESULTDESCRIPTION?.trim() ?? '',
}));
