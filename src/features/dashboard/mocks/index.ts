import { createFaker, defineMocks, type MockMethods, param } from '@/shared/mocks';
import fixture from './fixtures/dashboards.json';

const content = fixture.dashboards as Record<string, unknown[] | undefined>;
/** Метод виджета → тип (снимает pnpm metadata:sync из дашбордов и графиков меню). */
const methodTypes = new Map(Object.entries(fixture.widgetTypes as Record<string, number>));

const MONTHS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

function seedOf(text: string): number {
  let seed = 7;
  for (let i = 0; i < text.length; i += 1) seed = (seed * 31 + text.charCodeAt(i)) >>> 0;
  return seed;
}

/** Синтетические данные в формате ответа виджета нужного типа (см. dashboard/model/parse.ts). */
function widgetRows(method: string, type: number): unknown[] {
  const fake = createFaker(seedOf(method));
  switch (type) {
    case 2:
    case 3:
      return ['2024', '2025'].map((year) => ({
        LABEL: JSON.stringify(MONTHS),
        VALUE: JSON.stringify(MONTHS.map(() => String(fake.number.int({ min: 0, max: 900_000 })))),
        ITEMCOLOR: '#000000',
        TITLE: `${method.replace(/^WAChart/, '')}: ${year}`,
      }));
    case 4:
      return ['Терапия', 'Хирургия', 'Ортодонтия', 'Гигиена'].map((label) => ({
        LABEL: label,
        VALUE: String(fake.number.int({ min: 5, max: 60 })),
        ITEMCOLOR: '#000000',
      }));
    case 5:
      return ['Выручка', 'Записей', 'Новых клиентов'].map((label) => ({
        LABEL: label,
        PARAMVALUE: String(fake.number.int({ min: 0, max: 99_999 })),
        ITEMCOLOR: '#000000',
      }));
    case 8:
      return Array.from({ length: 5 }, (_, i) => ({
        ID: String(i + 1),
        PARAMNAME: fake.person.lastName(),
        PARAMVALUE: String(fake.number.int({ min: 1_000, max: 500_000 })),
        PARAMORDER: String(i + 1),
        IMGURL: '',
        ITEMCOLOR: '#000000',
      }));
    default:
      return [];
  }
}

const widgetMocks: MockMethods = {};
for (const [method, type] of methodTypes) widgetMocks[method] = () => widgetRows(method, type);

export const dashboardMocks = defineMocks({
  WAGetDashContent: (req) => content[param(req, 'DashId')] ?? [],
  ...widgetMocks,
});
