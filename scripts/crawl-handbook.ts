/**
 * Критерий фазы 1 трека B: «скрипт-обход открывает все разделы типа table на локальном
 * бэкенде без ошибок» (docs/PLAN.md). Обходит все 178 разделов и для каждого реально
 * вызывает ту же цепочку, что и движок (features/handbook/components/MetaTable.tsx):
 *
 *   WAGetItemMeta → WAGetItemParams → METHODNAME(UserId, ...paramValues)
 *
 *   pnpm crawl:handbook
 *
 * Это проверка контракта с бэкендом (данные приходят, схема не рвётся), не визуальная —
 * браузер в этом окружении недоступен. Поэтому пройденным разделам ставим 🚧 (не ✅):
 * ✅ по правилам CLAUDE.md — это ещё и визуальная проверка дизайн-системы, состояний,
 * клавиатуры, которую этот скрипт не делает.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { engineOf } from '../src/features/navigation/model/item-types.ts';

const API_URL = process.env.ELEVN_API_URL ?? 'http://localhost:8080/api.php';
const LOGIN = process.env.ELEVN_LOGIN ?? 'DemoOpatra';
const PASSWORD = process.env.ELEVN_PASSWORD ?? '123456789';
const REGISTRY = 'docs/sections.md';
const CONCURRENCY = 6;

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

interface CrawlResult {
  wanavid: string;
  recName: string;
  ok: boolean;
  error?: string;
}

async function crawlItem(row: Row, base: Record<string, unknown>): Promise<CrawlResult> {
  const wanavid = row.WANAVID ?? '';
  const recName = row.RECNAME ?? '';
  const itemId = row.RECID;
  const methodName = row.METHODNAME;
  if (!methodName) return { wanavid, recName, ok: false, error: 'нет METHODNAME в WAGetNav' };

  try {
    const meta = await call('WAGetItemMeta', { ...base, WAItemId: itemId, LangId: '0' });
    if (meta.length === 0) throw new Error('WAGetItemMeta вернул 0 колонок');

    const params = await call('WAGetItemParams', { UserId: base.UserId, WAItemId: itemId, LangId: '0' });
    const paramValues: Record<string, string> = Object.fromEntries(
      params.map((p): [string, string] => [p.DBFIELDNAME ?? '', p.DEFAULTVALUE ?? '']),
    );

    await call(methodName, { UserId: base.UserId, ...paramValues });
    return { wanavid, recName, ok: true };
  } catch (error) {
    return { wanavid, recName, ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/** Обновляет только колонку «Статус» у строк с движком table — остальное в файле не трогает. */
function updateStatuses(results: CrawlResult[]): void {
  if (!existsSync(REGISTRY)) throw new Error(`${REGISTRY} не найден — сначала pnpm metadata:sync`);
  const byWanavid = new Map(results.map((r) => [r.wanavid, r]));
  const lines = readFileSync(REGISTRY, 'utf8').split('\n');
  const updated = lines.map((line) => {
    const cells = line.split('|').map((c) => c.trim());
    if (cells.length < 10 || !/^\d+$/.test(cells[1] ?? '')) return line;
    const result = byWanavid.get(cells[1] ?? '');
    if (!result) return line;
    const status = result.ok ? '🚧' : '';
    const newCells = [...cells];
    newCells[newCells.length - 2] = status;
    return `| ${newCells.slice(1, -1).join(' | ')} |`;
  });
  writeFileSync(REGISTRY, updated.join('\n'));
}

async function main() {
  const [login] = await call('WAEmpLogin', { ULogin: LOGIN, UPassword: PASSWORD, SessionUUID: 'crawl-handbook' });
  if (login?.RESULT !== '0') throw new Error(`Логин не удался: ${login?.RESULTDESCRIPTION ?? 'нет ответа'}`);
  const base = { UserId: login.USERID, UserRoleId: login.USERROLE };

  const nav = await call('WAGetNav', { ...base, PRecId: 0, IsWholeNav: 1, LangId: '0' });
  const items = nav.filter((r) => engineOf(Number(r.RECTYPE)) === 'table');
  console.log(`Обхожу ${items.length} разделов типа table…`);

  const results = await mapWithConcurrency(items, CONCURRENCY, (row) => crawlItem(row, base));

  const failed = results.filter((r) => !r.ok);
  const passed = results.filter((r) => r.ok);
  console.log(`\nУспешно: ${passed.length}/${results.length}`);
  if (failed.length > 0) {
    console.log(`\nОшибки (${failed.length}):`);
    for (const f of failed) console.log(`  [${f.wanavid}] ${f.recName}: ${f.error}`);
  }

  updateStatuses(results);
  console.log(`\nСтатусы обновлены в ${REGISTRY} (🚧 — прошёл API-проверку, без отметки — упал или не проверен).`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  console.error(`\nБэкенд запущен? ELEVN_API_URL=${API_URL}`);
  process.exit(1);
});
