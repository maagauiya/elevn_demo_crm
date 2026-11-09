import { createFaker, defineMocks, MockError, param } from '@/shared/mocks';
import filter from './fixtures/filter.json';

/**
 * Журнал на синтетических данных: специалисты и записи генерируются faker-ом по дате (seed = дата),
 * созданные через WASCreateApp записи живут в памяти до перезагрузки страницы.
 * Формат ответов — как у процедур WAS_* (см. pnpm api:describe).
 */
const POSITIONS = ['Терапевт', 'Стоматолог-хирург', 'Ортодонт', 'Гигиенист', 'Косметолог'];
const STATUS_NAMES: Record<number, string> = {
  1: 'Предварительная запись',
  2: 'Клиент пришел',
  3: 'Выполненная услуга',
  4: 'Отмененная услуга',
  5: 'Подтвержденная запись',
  6: 'Запланированная услуга',
  7: 'Нерабочее время',
  8: 'Онлайн-запись',
  9: 'Выполнена и чек пробит',
};

const pad = (n: number) => String(n).padStart(2, '0');
const hhmm = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
const dateSeed = (date: string) => Number(date.replace(/\D/g, '')) || 1;

const doctorsFaker = createFaker(101);
const DOCTORS = Array.from({ length: 12 }, (_, i) => ({
  DOCID: String(2000 + i),
  DOCNAME: `${doctorsFaker.person.lastName()} ${doctorsFaker.person.firstName().charAt(0)}.`,
  DOCPOSITION: POSITIONS[i % POSITIONS.length],
  DOCPHOTO: '',
  DEPARTMENTCOLORID: '0',
  COMPWORKTIMEFROM: i % 4 === 3 ? '12:00:00' : '09:00:00',
  COMPWORKTIMETO: '20:00:00',
}));

const clientsFaker = createFaker(202);
const CLIENTS = Array.from({ length: 40 }, (_, i) => ({
  CLIENTID: String(5000 + i),
  SURNAME: clientsFaker.person.lastName(),
  NAME: clientsFaker.person.firstName(),
  SECONDNAME: '',
  BIRTHDATE: '',
  CELLPHONE: `7701${String(1_000_000 + i * 7919).slice(-7)}`,
  CARDNUMBER: String(10_000 + i),
  CARDTYPENAME: 'Карта клиента',
  RESULTSTRING: '',
}));

const SERVICES = ['Консультация', 'Профгигиена', 'Пломба', 'Удаление зуба', 'Отбеливание', 'Чистка лица'].map(
  (name, i) => ({
    MID: String(300 + i),
    MNAME: name,
    MPRICE: String((i + 2) * 5000),
    MCODE: '',
    MGNAME: 'Услуги',
    MG2NAME: '',
    MG3NAME: '',
  }),
);

type AppRow = Record<string, string>;
const created = new Map<string, AppRow[]>();
let nextId = 900_000;

function appRow(
  id: number,
  doctorId: string,
  start: number,
  duration: number,
  status: number,
  client: (typeof CLIENTS)[number],
  comment = '',
  services: string[] = [],
): AppRow {
  const clientName = `${client.SURNAME} ${client.NAME}  ${client.CELLPHONE}`;
  return {
    APPID: String(id),
    APPST: hhmm(start),
    APPET: hhmm(start + duration),
    APPSUB: `${comment} ${clientName} Карта ${client.CARDNUMBER}\n${services.join('\n')}${services.length ? '\n' : ''}${STATUS_NAMES[status] ?? ''}\n`,
    DOCID: doctorId,
    APPSTATUSID: String(status),
    BCOLOR: '',
    APPMANIPLIST: '',
    APPCOMMENT: comment,
    CLIENTID: client.CLIENTID,
    ICONLIST: '',
    MEDCARDID: '0',
    ISYAOR: status === 8 ? '1' : '0',
    CABINETID: String(1 + (Number(doctorId) % 2)),
    CABINETNUMBER: String(1 + (Number(doctorId) % 2)),
    EQCOLORID: '0',
    SPCOLORID: '0',
    WASSISTANT: '0',
    ASSISTANTNAME: '',
    CLIENTNAME: clientName,
    ISCURDOCREQUIRED: '0',
    APPBUTTONLIST: '',
  };
}

function generatedDay(date: string): AppRow[] {
  const fake = createFaker(dateSeed(date));
  const rows: AppRow[] = [];
  // id уникальны между днями: (дата mod 100000) * 1000 + порядковый номер.
  let id = (dateSeed(date) % 100_000) * 1000;
  for (const doctor of DOCTORS) {
    let minute = toMinute(doctor.COMPWORKTIMEFROM);
    while (minute < 19 * 60) {
      minute += fake.helpers.arrayElement([0, 0, 15, 30, 60]);
      const duration = fake.helpers.arrayElement([30, 30, 45, 60, 90]);
      if (minute + duration > 20 * 60) break;
      const status = fake.helpers.weightedArrayElement([
        { value: 5, weight: 4 },
        { value: 2, weight: 2 },
        { value: 3, weight: 3 },
        { value: 1, weight: 2 },
        { value: 4, weight: 1 },
        { value: 8, weight: 1 },
        { value: 7, weight: 0.3 },
      ]);
      const client = fake.helpers.arrayElement(CLIENTS);
      const services = fake.helpers.arrayElements(SERVICES, { min: 0, max: 2 }).map((s) => s.MNAME);
      rows.push(appRow(id++, doctor.DOCID, minute, duration, status, client, status === 7 ? 'Обед' : '', services));
      minute += duration;
    }
  }
  return rows;
}

function toMinute(time: string): number {
  const [h = '0', m = '0'] = time.split(':');
  return Number(h) * 60 + Number(m);
}

/** Перенесённые/изменённые и удалённые записи — поверх сгенерированных дней. */
const moved = new Map<string, { row: AppRow; date: string }>();
const deleted = new Set<string>();
/** id → (строка, дата) для всего, что уже отдавали, — чтобы найти запись при изменении. */
const seen = new Map<string, { row: AppRow; date: string }>();

function dayRows(date: string): AppRow[] {
  const base = [...generatedDay(date), ...(created.get(date) ?? [])].filter(
    (r) => !moved.has(r.APPID ?? '') && !deleted.has(r.APPID ?? ''),
  );
  const extra = [...moved.values()].filter((m) => m.date === date && !deleted.has(m.row.APPID ?? '')).map((m) => m.row);
  const rows = [...base, ...extra];
  for (const row of rows) seen.set(row.APPID ?? '', { row, date });
  return rows;
}

function eachDate(from: string, to: string): string[] {
  const dates: string[] = [];
  const d = new Date(`${from}T00:00`);
  const end = new Date(`${to}T00:00`);
  while (d <= end) {
    dates.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

const CABINETS = [1, 2].map((id) => ({
  ID: String(id),
  NAME: `Кабинет ${id}`,
  VISIBLE: '1',
  ORDERNUMBER: String(id),
  CAPACITY: id === 2 ? '8' : '1',
  IMGURL: '',
  COMPANYID: '1',
  COMPWORKTIMEFROM: '09:00:00',
  COMPWORKTIMETO: '20:00:00',
  CABTYPENAME: id === 2 ? 'Зал' : 'Кабинет №',
}));

const trainingRows = (date: string) => [
  {
    TRAININGID: '700',
    TRAININGST: '10:00',
    TRAININGET: '11:00',
    TRAININGSUB: 'Йога для начинающих',
    DOCID: '2000',
    CABINETID: '2',
    CABINETNUMBER: '2',
    DOCTORNAME: DOCTORS[0]?.DOCNAME ?? '',
    MAXCLIENTCOUNT: '8',
    MANIPULATIONID: '1',
    MANIPULATIONSTATUSID: '5',
    TRAININGDATE: date,
  },
  {
    TRAININGID: '701',
    TRAININGST: '18:00',
    TRAININGET: '19:30',
    TRAININGSUB: 'Пилатес',
    DOCID: '2001',
    CABINETID: '2',
    CABINETNUMBER: '2',
    DOCTORNAME: DOCTORS[1]?.DOCNAME ?? '',
    MAXCLIENTCOUNT: '10',
    MANIPULATIONID: '2',
    MANIPULATIONSTATUSID: '1',
    TRAININGDATE: date,
  },
];

const schedule = (from: string, to: string) =>
  eachDate(from, to).map((date) => ({
    CHECKDATE: date,
    ISWORKDATE: new Date(`${date}T00:00`).getDay() === 0 ? '0' : '1',
    COMPWORKTIMEFROM: '09:00:00',
    COMPWORKTIMETO: '20:00:00',
  }));

const ok = (text: string) => [{ RESULT: '0', RESULTDESCRIPTION: text, UPDATEDDATA: 'NO DATA' }];

export const logbookMocks = defineMocks({
  WASGetFilter: () => filter,
  WASGetDocList: () => DOCTORS,
  WASGetAppList: (req) => dayRows(param(req, 'OPDate')),
  WASGetAppListDoc: (req) =>
    eachDate(param(req, 'DateFrom'), param(req, 'DateTo')).flatMap((date) =>
      dayRows(date)
        .filter((r) => r.DOCID === param(req, 'Doc_Id'))
        .map((r) => ({ ...r, APPDATE: date })),
    ),
  WASGetAppListCab: (req) =>
    eachDate(param(req, 'DateFrom'), param(req, 'DateTo')).flatMap((date) =>
      dayRows(date)
        .filter((r) => r.CABINETID === param(req, 'Cab_Id'))
        .map((r) => ({ ...r, APPDATE: date })),
    ),
  WASGetDocSchedule: (req) => schedule(param(req, 'DateFrom'), param(req, 'DateTo')),
  WASGetCabSchedule: (req) => schedule(param(req, 'DateFrom'), param(req, 'DateTo')),
  WASGetCabList: () => CABINETS,
  WASGetTrainingList: (req) => trainingRows(param(req, 'OpDate')),
  WASGetTrainingListCab: (req) =>
    param(req, 'Cab_Id') === '2' ? eachDate(param(req, 'DateFrom'), param(req, 'DateTo')).flatMap(trainingRows) : [],
  WASGetClientAppList: (req) =>
    [0, 1, 2].map((i) => ({
      APPDATE: `${pad(10 + i)}.11.2026 1${i}:00`,
      DOCTORNAME: DOCTORS[i]?.DOCNAME ?? '',
      MANIPLIST: SERVICES[i]?.MNAME ?? '',
      VISITSUMMA: '0.00',
      ISCOURSEAPP: 'Нет',
      COMPANYNAME: 'Главный офис',
      APPTYPE: '0',
      APPID: String(800_000 + Number(param(req, 'ClientId')) * 10 + i),
      DOCTORID: DOCTORS[i]?.DOCID ?? '',
      CABINETID: '0',
      CABINETNAME: '',
    })),
  WASUpdateApp: (req) => {
    const found = seen.get(param(req, 'App_Id'));
    if (!found) throw new MockError('Событие не найдено', 4);
    if (found.row.APPSTATUSID === '3')
      return [{ RESULT: '1', RESULTDESCRIPTION: 'Изменение данного события недоступно', UPDATEDDATA: '' }];
    const [date = found.date, st = found.row.APPST ?? ''] = param(req, 'App_ST').split(' ');
    const et = param(req, 'App_ET').split(' ')[1] ?? found.row.APPET ?? '';
    const comment = param(req, 'AppComment');
    const row = {
      ...found.row,
      APPST: st,
      APPET: et,
      DOCID: param(req, 'Doc_Id') || (found.row.DOCID ?? ''),
      ...(comment ? { APPCOMMENT: comment.trim() } : {}),
    };
    moved.set(param(req, 'App_Id'), { row, date });
    return ok('Событие изменено');
  },
  WASDeleteApp: (req) => {
    deleted.add(param(req, 'App_Id'));
    return ok('Событие удалено');
  },
  WASCopyApp: (req) => {
    const found = seen.get(param(req, 'Id'));
    if (!found) throw new MockError('Событие не найдено', 4);
    const [date = found.date, time = '12:00'] = param(req, 'AppStart').split(' ');
    const duration = toMinute(found.row.APPET ?? '') - toMinute(found.row.APPST ?? '');
    const id = String(nextId++);
    const row = {
      ...found.row,
      APPID: id,
      APPST: time,
      APPET: hhmm(toMinute(time) + duration),
      DOCID: param(req, 'DocId') || (found.row.DOCID ?? ''),
      APPSTATUSID: '1',
    };
    moved.set(id, { row, date });
    return [{ NAPPID: id, RESULT: '0', RESULTDESCRIPTION: 'Событие скопировано', UPDATEDDATA: 'NO DATA' }];
  },
  WASGetClientList: (req) => {
    const q = param(req, 'SString').toLowerCase();
    return CLIENTS.filter((c) => `${c.SURNAME} ${c.NAME} ${c.CELLPHONE} ${c.CARDNUMBER}`.toLowerCase().includes(q));
  },
  WASGetManipList: () => SERVICES,
  WASCreateApp: (req) => {
    const [date = '', time = '00:00'] = param(req, 'App_ST').split(' ');
    const client = CLIENTS.find((c) => c.CLIENTID === param(req, 'Client_Id'));
    if (!client) throw new MockError('Клиент не найден', 3);
    const services = param(req, 'ManipList')
      .split(';')
      .filter(Boolean)
      .map((part) => SERVICES.find((s) => s.MID === part.split(':')[0])?.MNAME ?? '');
    const id = nextId++;
    const row = appRow(id, param(req, 'Doc_Id'), toMinute(time), 30, 5, client, param(req, 'AppComment'), services);
    created.set(date, [...(created.get(date) ?? []), row]);
    return [{ NAPPID: String(id), RESULT: '0', RESULTDESCRIPTION: 'Событие создано', UPDATEDDATA: 'NO DATA' }];
  },
});
