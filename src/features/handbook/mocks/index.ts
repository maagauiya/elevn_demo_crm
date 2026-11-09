import { createFaker, defineMocks, type MockMethods, type MockRequest } from '@/shared/mocks';
import editorFieldsFixture from './fixtures/editor-fields.json';
import tableMetaFixture from './fixtures/table-meta.json';

interface MetaRow {
  FTYPEID: string;
  FNAME: string;
}

interface ParamRow {
  DBFIELDNAME: string;
}

interface TableMetaEntry {
  methodName: string;
  meta: MetaRow[];
  params: ParamRow[];
}

/**
 * Снимок метаданных движка таблиц (pnpm metadata:sync): для каждого раздела — колонки
 * (WAGetItemMeta) и входные параметры (WAGetItemParams), реальные, с локального бэкенда.
 * Строк данных в снимке нет — их генерирует faker по типам колонок (см. ниже).
 */
const fixture = tableMetaFixture as Record<string, TableMetaEntry>;
/** Снимок полей редактора (WAGetItemEditor) по EDITORTABLE — pnpm metadata:sync. */
const editorFields = editorFieldsFixture as Record<string, unknown[]>;

/** Несколько разделов могут делить один METHODNAME (общий справочник) — берём первую метку колонок. */
const entryByMethod = new Map<string, TableMetaEntry>();
for (const entry of Object.values(fixture)) {
  if (!entryByMethod.has(entry.methodName)) entryByMethod.set(entry.methodName, entry);
}

/** Детерминированный числовой seed из имени метода — так данные раздела не "прыгают" между запусками. */
function seedFromString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  return hash;
}

type Faker = ReturnType<typeof createFaker>;

/**
 * Текст для varchar-колонки (FTYPEID=4) по смыслу имени поля — иначе faker.lorem у русской
 * локали собирает случайные канцелярские слова в бессвязную фразу, это нечитаемо как демо-данные.
 */
function fakeTextValue(faker: Faker, columnName: string): string {
  const name = columnName.toUpperCase();
  if (name.includes('PHONE')) return `7${faker.string.numeric(10)}`;
  if (name.includes('EMAIL')) return faker.internet.email();
  if (name.includes('ADDRESS')) return faker.location.streetAddress();
  if (name.includes('COMMENT') || name.includes('DESCRIPTION') || name.includes('NOTE')) return faker.lorem.sentence();
  if (name === 'SURNAME' || name === 'SECONDNAME') return faker.person.lastName();
  if (name === 'NAME') return faker.person.firstName();
  if (name.endsWith('NAME')) return faker.company.name();
  return faker.commerce.productName();
}

/** Значение ячейки по типу колонки (FTYPEID) — та же нумерация, что в features/handbook/model/column-types.ts. */
function fakeCellValue(faker: Faker, typeId: string, columnName: string): string {
  switch (typeId) {
    case '1':
      return String(faker.number.int({ min: 1, max: 999 }));
    case '2':
      return faker.datatype.boolean() ? '1' : '0';
    case '3':
      return faker.finance.amount({ min: 0, max: 5000, dec: 2 });
    case '5':
    case '40':
      return faker.lorem.sentence();
    case '6':
      return faker.date.past().toISOString().slice(0, 10);
    case '7':
      return faker.date.past().toISOString().slice(0, 19).replace('T', ' ');
    case '8':
      return `7${faker.string.numeric(10)}`;
    case '9':
      return faker.date.past().toTimeString().slice(0, 8);
    default:
      return fakeTextValue(faker, columnName);
  }
}

const ROW_COUNT = 24;
const DICT_OPTIONS_COUNT = 8;

function rowsForEntry(entry: TableMetaEntry): Record<string, string>[] {
  const faker = createFaker(seedFromString(entry.methodName));
  return Array.from({ length: ROW_COUNT }, () =>
    Object.fromEntries(entry.meta.map((col) => [col.FNAME, fakeCellValue(faker, col.FTYPEID, col.FNAME)])),
  );
}

const dataMethods: MockMethods = Object.fromEntries(
  [...entryByMethod.entries()].map(([methodName, entry]) => [methodName, () => rowsForEntry(entry)]),
);

/**
 * Моки фичи handbook (трек B): движок универсальных таблиц.
 * WAGetItemMeta/WAGetItemParams — снимок с бэкенда по WAItemId; данные раздела (METHODNAME) — faker
 * по типам колонок из того же снимка. WAGetItemParamDict — общий фейковый справочник для параметров
 * с выбором из списка (FIELDTYPEID=10).
 */
export const handbookMocks = defineMocks({
  WAGetItemMeta: ({ WAItemId }: MockRequest) => fixture[String(WAItemId)]?.meta ?? [],
  WAGetItemParams: ({ WAItemId }: MockRequest) => fixture[String(WAItemId)]?.params ?? [],
  WAGetItemParamDict: ({ DictName }: MockRequest) => {
    const faker = createFaker(seedFromString(typeof DictName === 'string' ? DictName : 'dict'));
    return Array.from({ length: DICT_OPTIONS_COUNT }, (_, i) => ({
      DICTID: String(i + 1),
      DICTVALUE: faker.company.name(),
    }));
  },
  WAGetItemEditor: ({ EditorTable }: MockRequest) => editorFields[String(EditorTable)] ?? [],
  // Моки не хранят состояние между запросами — редактор всегда открывается в режиме создания.
  WAGetEditorData: () => [],
  WAEditTable: () => [{ RESULT: '0', RESULTDESCRIPTION: 'OK' }],
  WAEditUser: () => [{ RESULT: '0', RESULTDESCRIPTION: 'OK' }],
  WAEditMedcard: () => [{ RESULT: '0', RESULTDESCRIPTION: 'OK' }],
  ...dataMethods,
});
