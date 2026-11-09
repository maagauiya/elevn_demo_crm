/**
 * Синхронизация метаданных с локальным бэкендом (local-proj: docker compose up -d firebird api).
 *
 *   pnpm metadata:sync
 *
 * 1. Снимает меню (WAGetNav) на ru и en → src/features/navigation/mocks/fixtures/nav.json.
 *    MSW-моки отдают ровно то, что отдаёт бэкенд, — e2e и dev:mocks совпадают с реальностью.
 * 2. Генерирует реестр разделов docs/sections.md: каждый пункт меню → движок → маршрут → трек.
 *    Колонку «Статус» скрипт сохраняет между запусками — её ведут руками.
 *
 * 3. Метаданные экранов: входные параметры пунктов и виджетов (WAGetItemParams) + их справочники,
 *    состав дашбордов (WAGetDashContent), фильтр журнала (WASGetFilter).
 *
 * Берём только метаданные. Строки данных (записи, значения графиков) в фикстуры не пишем —
 * их генерируют моки фич через faker.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { ENGINE_TRACK, engineOf, FOLDER_TYPE, itemPath } from '../src/features/navigation/model/item-types.ts';

const API_URL = process.env.ELEVN_API_URL ?? 'http://localhost:8080/api.php';
const LOGIN = process.env.ELEVN_LOGIN ?? 'DemoOpatra';
const PASSWORD = process.env.ELEVN_PASSWORD ?? '123456789';

const NAV_FIXTURE = 'src/features/navigation/mocks/fixtures/nav.json';
const PARAMS_FIXTURE = 'src/features/item-params/mocks/fixtures/params.json';
const DASH_FIXTURE = 'src/features/dashboard/mocks/fixtures/dashboards.json';
const FILTER_FIXTURE = 'src/features/logbook/mocks/fixtures/filter.json';
const REGISTRY = 'docs/sections.md';

type Row = Record<string, string>;

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

function writeJson(path: string, data: unknown) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}

const DASHBOARD_TYPE = 6;
const CHART_TYPES = new Set([2, 3, 4, 5, 8, 11]);

async function syncScreens(userId: string, nav: Row[]) {
  const user = { UserId: userId, LangId: '0' };
  const dashIds = nav.filter((r) => Number(r.RECTYPE) === DASHBOARD_TYPE).map((r) => r.RECID ?? '');
  const chartIds = nav.filter((r) => CHART_TYPES.has(Number(r.RECTYPE))).map((r) => r.RECID ?? '');
  // Спец-экраны со входными параметрами (график работы: филиал).
  const paramScreenIds = nav.filter((r) => Number(r.RECTYPE) < 0 && r.WINPUTPARAMS === '1').map((r) => r.RECID ?? '');

  const dashboards: Record<string, Row[]> = {};
  for (const id of dashIds) dashboards[id] = await call('WAGetDashContent', { ...user, DashId: id });

  // Параметры нужны пунктам меню (дашборды, графики) и каждому виджету.
  const paramItemIds = new Set([
    ...dashIds,
    ...chartIds,
    ...paramScreenIds,
    ...Object.values(dashboards)
      .flat()
      .map((w) => w.WAITEMID ?? ''),
  ]);
  const params: Record<string, Row[]> = {};
  const dicts: Record<string, Row[]> = {};
  for (const id of paramItemIds) {
    params[id] = await call('WAGetItemParams', { ...user, WAItemId: id });
    for (const p of params[id]) {
      if (!p.DICTNAME) continue;
      const key = `${p.DICTNAME}|${p.DICTTYPE ?? '0'}|${p.WUSERID ?? '0'}`;
      // Фикстурам нужна структура, а не вся база: большие справочники (клиенты) обрезаем.
      dicts[key] ??= (
        await call('WAGetItemParamDict', {
          ...user,
          DictName: p.DICTNAME,
          DictType: p.DICTTYPE ?? '0',
          WUserId: p.WUSERID ?? '0',
        })
      ).slice(0, 50);
    }
  }

  const filter = await call('WASGetFilter', { ...user, IsWholeFilter: 1, ScheduleType: 0 });

  // Метод → тип виджета: моки генерируют данные нужной формы (включая графики из меню).
  const widgetTypes: Record<string, number> = {};
  for (const w of Object.values(dashboards).flat()) if (w.METHODNAME) widgetTypes[w.METHODNAME] = Number(w.ITEMTYPEID);
  for (const r of nav)
    if (r.METHODNAME && CHART_TYPES.has(Number(r.RECTYPE))) widgetTypes[r.METHODNAME] = Number(r.RECTYPE);
  writeJson(DASH_FIXTURE, { dashboards, widgetTypes });
  writeJson(PARAMS_FIXTURE, { params, dicts });
  writeJson(FILTER_FIXTURE, filter);
  console.log(
    `Дашборды: ${dashIds.length}, параметры: ${paramItemIds.size} пунктов, справочники: ${Object.keys(dicts).length}`,
  );
}

async function main() {
  const [login] = await call('WAEmpLogin', { ULogin: LOGIN, UPassword: PASSWORD, SessionUUID: 'metadata-sync' });
  if (login?.RESULT !== '0') throw new Error(`Логин не удался: ${login?.RESULTDESCRIPTION ?? 'нет ответа'}`);
  const base = { UserId: login.USERID, UserRoleId: login.USERROLE, PRecId: 0, IsWholeNav: 1 };

  const [ru, en] = await Promise.all([
    call('WAGetNav', { ...base, LangId: '0' }),
    call('WAGetNav', { ...base, LangId: '1' }),
  ]);
  writeJson(NAV_FIXTURE, { ru: cleanNav(ru), en: cleanNav(en) });
  writeFileSync(REGISTRY, buildRegistry(ru));
  console.log(`Меню: ${ru.length} строк → ${NAV_FIXTURE}`);
  console.log(`Реестр разделов → ${REGISTRY}`);
  await syncScreens(login.USERID ?? '', ru);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  console.error(`\nБэкенд запущен? cd ../local-proj && docker compose up -d firebird api  (API: ${API_URL})`);
  process.exit(1);
});
