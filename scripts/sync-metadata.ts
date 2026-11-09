/**
 * Синхронизация метаданных с локальным бэкендом (local-proj: docker compose up -d firebird api).
 *
 *   pnpm metadata:sync
 *
 * 1. Снимает меню (WAGetNav) на ru и en → src/features/navigation/mocks/fixtures/nav.json.
 *    MSW-моки отдают ровно то, что отдаёт бэкенд, — e2e и dev:mocks совпадают с реальностью.
 * 2. Генерирует реестр разделов docs/sections.md: каждый пункт меню → движок → маршрут → трек.
 *    Колонку «Статус» скрипт сохраняет между запусками — её ведут руками.
 * 3. Снимает метаданные движка таблиц (WAGetItemMeta + WAGetItemParams) для каждого раздела
 *    типа table → src/features/handbook/mocks/fixtures/table-meta.json.
 *
 * Берём только метаданные (структуру меню и колонок). Строки данных в фикстуры не пишем —
 * мок-хендлер handbook генерирует их faker-ом по типам колонок (см. features/handbook/mocks).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { ENGINE_TRACK, engineOf, FOLDER_TYPE, itemPath } from '../src/features/navigation/model/item-types.ts';

const API_URL = process.env.ELEVN_API_URL ?? 'http://localhost:8080/api.php';
const LOGIN = process.env.ELEVN_LOGIN ?? 'DemoOpatra';
const PASSWORD = process.env.ELEVN_PASSWORD ?? '123456789';

const NAV_FIXTURE = 'src/features/navigation/mocks/fixtures/nav.json';
const REGISTRY = 'docs/sections.md';
const TABLE_META_FIXTURE = 'src/features/handbook/mocks/fixtures/table-meta.json';
const EDITOR_FIELDS_FIXTURE = 'src/features/handbook/mocks/fixtures/editor-fields.json';
/** Сколько разделов опрашиваем параллельно — 178 штук, бэкенд это не DDoS-атака, но и не нужно бить залпом. */
const CONCURRENCY = 8;

type Row = Record<string, string>;

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array<R>(items.length);
  let next = 0;
  async function worker() {
    for (;;) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await fn(items[i] as T);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function call(method: string, params: Record<string, unknown>): Promise<Row[]> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ MethodName: method, ApiKey: 'local', ...params }),
  });
  const json = (await res.json()) as { data?: Row[]; result: number | string; resultdescription?: string };
  if (Number(json.result) !== 0) throw new Error(`${method}: ${json.resultdescription ?? 'error'}`);
  return json.data ?? [];
}

const NAV_FIELDS = [
  'RECID',
  'RECTYPE',
  'RECNAME',
  'RECICON',
  'METHODNAME',
  'HASDETAILS',
  'EDITORTABLE',
  'EMETHODNAME',
  'WINPUTPARAMS',
  'DEFAULTBONCLICK',
  'ISVISIBLE',
  'ISEDITABLE',
  'NPRECID',
  'ISFONLOAD',
  'WANAVID',
];

/** Только поля меню; иконку — без внешнего домена (оставляем имя файла). */
function cleanNav(rows: Row[]): Row[] {
  return rows.map((row) => {
    const out: Row = {};
    for (const field of NAV_FIELDS) out[field] = row[field] ?? '';
    out.RECICON = (out.RECICON ?? '').split('/').at(-1) ?? '';
    return out;
  });
}

function readStatuses(): Map<string, string> {
  const statuses = new Map<string, string>();
  if (!existsSync(REGISTRY)) return statuses;
  for (const line of readFileSync(REGISTRY, 'utf8').split('\n')) {
    const cells = line.split('|').map((c) => c.trim());
    // | WANAVID | Раздел | Тип | Движок | Трек | Маршрут | Метод данных | Статус |
    if (cells.length >= 10 && /^\d+$/.test(cells[1] ?? '')) statuses.set(cells[1] ?? '', cells[8] ?? '');
  }
  return statuses;
}

function buildRegistry(rows: Row[]): string {
  const byKey = new Map(rows.map((r) => [r.WANAVID, r]));
  const trail = (row: Row): string => {
    const parts: string[] = [];
    let parent = byKey.get(row.NPRECID ?? '');
    while (parent) {
      parts.unshift(parent.RECNAME ?? '');
      parent = byKey.get(parent.NPRECID ?? '');
    }
    return [...parts, row.RECNAME].join(' › ');
  };

  const statuses = readStatuses();
  const items = rows.filter((r) => Number(r.RECTYPE) !== FOLDER_TYPE);
  const counts = new Map<string, number>();
  const lines = items.map((row) => {
    const type = Number(row.RECTYPE);
    const engine = engineOf(type);
    const track = engine ? ENGINE_TRACK[engine] : '—';
    counts.set(engine ?? 'неизвестно', (counts.get(engine ?? 'неизвестно') ?? 0) + 1);
    const hidden = row.ISVISIBLE === '1' ? '' : ' (скрыт для роли)';
    const status = statuses.get(row.WANAVID ?? '') ?? '';
    return `| ${row.WANAVID} | ${trail(row)}${hidden} | ${type} | ${engine ?? '**неизвестно**'} | ${track} | ${
      itemPath(type, Number(row.RECID)) ?? '—'
    } | ${row.METHODNAME ? `\`${row.METHODNAME}\`` : '—'} | ${status} |`;
  });

  const summary = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([engine, n]) => `| ${engine} | ${n} |`)
    .join('\n');

  return `# Реестр разделов

> Сгенерировано \`pnpm metadata:sync\` из меню локального бэкенда (пользователь ${LOGIN}).
> Не редактируй руками ничего, кроме колонки «Статус»: она сохраняется между запусками.
> Статусы: пусто — не начато, 🚧 — в работе, ✅ — готово и проверено на локальном бэкенде.

Разделы рисуются движками: один движок закрывает все пункты своего типа. Отдельные экраны
пишутся только для движков logbook, offices, training, work-schedule и kanban.

| Движок | Пунктов |
| --- | --- |
${summary}

| WANAVID | Раздел | Тип | Движок | Трек | Маршрут | Метод данных | Статус |
| --- | --- | --- | --- | --- | --- | --- | --- |
${lines.join('\n')}
`;
}

interface TableMetaEntry {
  methodName: string;
  meta: Row[];
  params: Row[];
}

/** Для каждого раздела движка table снимает WAGetItemMeta + WAGetItemParams. Данных (строк) не берёт. */
async function syncTableMeta(rows: Row[], base: Record<string, unknown>): Promise<Record<string, TableMetaEntry>> {
  const items = rows.filter((r) => engineOf(Number(r.RECTYPE)) === 'table' && r.METHODNAME);
  const entries = await mapWithConcurrency(items, CONCURRENCY, async (row) => {
    const itemId = row.RECID;
    const [meta, params] = await Promise.all([
      call('WAGetItemMeta', { ...base, WAItemId: itemId, LangId: '0' }),
      call('WAGetItemParams', { UserId: base.UserId, WAItemId: itemId, LangId: '0' }),
    ]);
    return [itemId, { methodName: row.METHODNAME, meta, params }] as const;
  });
  return Object.fromEntries(entries) as Record<string, TableMetaEntry>;
}

/** Для каждой уникальной EDITORTABLE снимает поля редактора (WAGetItemEditor). */
async function syncEditorFields(rows: Row[], base: Record<string, unknown>): Promise<Record<string, Row[]>> {
  const tables = [...new Set(rows.map((r) => r.EDITORTABLE).filter((t): t is string => !!t))];
  const entries = await mapWithConcurrency(tables, CONCURRENCY, async (editorTable) => {
    const fields = await call('WAGetItemEditor', { ...base, EditorTable: editorTable, LangId: '0' });
    return [editorTable, fields] as const;
  });
  return Object.fromEntries(entries);
}

async function main() {
  const [login] = await call('WAEmpLogin', { ULogin: LOGIN, UPassword: PASSWORD, SessionUUID: 'metadata-sync' });
  if (login?.RESULT !== '0') throw new Error(`Логин не удался: ${login?.RESULTDESCRIPTION ?? 'нет ответа'}`);
  const base = { UserId: login.USERID, UserRoleId: login.USERROLE, PRecId: 0, IsWholeNav: 1 };

  const [ru, en] = await Promise.all([
    call('WAGetNav', { ...base, LangId: '0' }),
    call('WAGetNav', { ...base, LangId: '1' }),
  ]);
  writeFileSync(NAV_FIXTURE, `${JSON.stringify({ ru: cleanNav(ru), en: cleanNav(en) }, null, 2)}\n`);
  writeFileSync(REGISTRY, buildRegistry(ru));
  console.log(`Меню: ${ru.length} строк → ${NAV_FIXTURE}`);
  console.log(`Реестр разделов → ${REGISTRY}`);

  const tableMeta = await syncTableMeta(ru, base);
  writeFileSync(TABLE_META_FIXTURE, `${JSON.stringify(tableMeta, null, 2)}\n`);
  console.log(`Метаданные таблиц: ${Object.keys(tableMeta).length} разделов → ${TABLE_META_FIXTURE}`);

  const editorFields = await syncEditorFields(ru, base);
  writeFileSync(EDITOR_FIELDS_FIXTURE, `${JSON.stringify(editorFields, null, 2)}\n`);
  console.log(`Поля редактора: ${Object.keys(editorFields).length} таблиц → ${EDITOR_FIELDS_FIXTURE}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  console.error(`\nБэкенд запущен? cd ../local-proj && docker compose up -d firebird api  (API: ${API_URL})`);
  process.exit(1);
});
