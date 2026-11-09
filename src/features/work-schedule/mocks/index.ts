import { createFaker, defineMocks, param } from '@/shared/mocks';

/**
 * График работы на синтетических данных. Статусы — как в WATTGetStatusList демо-базы.
 * Установка и очистка статусов живут в памяти — e2e проверяют полный цикл.
 */
const STATUSES = [
  { STATUSID: '1', NAME: 'Рабочий', WDETEDIT: '0' },
  { STATUSID: '7', NAME: 'Неполный день', WDETEDIT: '1' },
  { STATUSID: '2', NAME: 'Выходной', WDETEDIT: '0' },
  { STATUSID: '3', NAME: 'Отпуск', WDETEDIT: '0' },
  { STATUSID: '5', NAME: 'Больничный', WDETEDIT: '0' },
  { STATUSID: '4', NAME: 'Отгул', WDETEDIT: '0' },
  { STATUSID: '6', NAME: 'Прогул', WDETEDIT: '0' },
];

const fake = createFaker(303);
const DOCTORS = Array.from({ length: 8 }, (_, i) => ({
  DOCID: String(3000 + i),
  DOCNAME: `${fake.person.lastName()} ${fake.person.firstName()}`,
  DOCPOS: ['Терапевт', 'Ортодонт', 'Гигиенист', 'Администратор'][i % 4] ?? '',
  DOCORDERNUM: String(i),
}));

interface Day {
  statusId: string;
  hours: string;
}
const overrides = new Map<string, Day | null>();

function baseDay(docId: string, date: string): Day | null {
  const day = new Date(`${date}T00:00`).getDay();
  if (Number(docId) % 3 === 0) return null; // часть специалистов без графика
  if (day === 0) return { statusId: '2', hours: '' };
  return { statusId: '1', hours: ' 09:00-20:00' };
}

function eachDate(from: string, to: string): string[] {
  const out: string[] = [];
  const d = new Date(`${from}T00:00`);
  const end = new Date(`${to}T00:00`);
  while (d <= end) {
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    d.setDate(d.getDate() + 1);
  }
  return out;
}

const pairs = (list: string) =>
  list
    .split(';')
    .filter(Boolean)
    .map((item) => item.split(',') as [string, string]);

const done = [{ RESULT: '0', RESULTDESCRIPTION: 'Успешно' }];

export const workScheduleMocks = defineMocks({
  WATTGetTree: () => [
    { DEPID: '-1', DEPNAME: 'Весь филиал' },
    { DEPID: '1', DEPNAME: 'Врачи' },
  ],
  WATTGetDoctorList: (req) => (param(req, 'DepId') === '1' ? DOCTORS.slice(0, 4) : DOCTORS),
  WATTGetTTData: (req) =>
    DOCTORS.flatMap((doc) =>
      eachDate(param(req, 'DateFrom'), param(req, 'DateTo')).flatMap((date) => {
        const key = `${doc.DOCID},${date}`;
        const day = overrides.has(key) ? overrides.get(key) : baseDay(doc.DOCID, date);
        return day
          ? [{ DOCID: doc.DOCID, STATUSID: day.statusId, OPDATE: date, CNAME: '', TOOLTIP: day.hours, APPCOUNT: '0' }]
          : [];
      }),
    ),
  WATTGetStatusList: () => STATUSES,
  WATTSetStatusMultiple: (req) => {
    const hours = param(req, 'TimeList')
      .split(',')
      .filter(Boolean)
      .map((r) => r.replace(/:00(?=-|$)/g, ''))
      .join(', ');
    for (const [docId, date] of pairs(param(req, 'DocDateList'))) {
      overrides.set(`${docId},${date}`, {
        statusId: param(req, 'StatusId'),
        hours: hours ? ` ${hours}` : param(req, 'StatusId') === '1' ? ' 09:00-20:00' : '',
      });
    }
    return done;
  },
  WATTClearMultiple: (req) => {
    for (const [docId, date] of pairs(param(req, 'DocdateList'))) overrides.set(`${docId},${date}`, null);
    return done;
  },
  WATTGetTimeTableTemplateList: () => [
    { ID: '1', NAME: '5/2 (полный день)' },
    { ID: '2', NAME: '2/2 (полный день)' },
  ],
  WATTSetByTimeTableTemplate: () => done,
  WATTAddTimeTableTemplate: () => [{ ADDEDID: '9', RESULT: '0', RESULTDESCRIPTION: 'Шаблон сохранён' }],
  WATTGetPeriodList: () => [],
  WATTCopyPeriod: () => done,
});
