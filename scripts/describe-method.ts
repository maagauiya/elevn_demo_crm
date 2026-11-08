/**
 * Контракт метода API прямо из базы локального бэкенда: процедура, описание, входные и выходные параметры.
 *
 *   pnpm api:describe WAGetItemMeta
 *
 * Источник — таблицы API_METHODS и API_METHOD_PARAMS (по ним PHP-прокси строит SQL).
 * Нужен запущенный бэкенд: cd ../local-proj && docker compose up -d firebird api
 */
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const BACKEND_DIR = resolve(process.env.ELEVN_BACKEND_DIR ?? '../local-proj');
const DB_PATH = process.env.ELEVN_DB_PATH ?? '/firebird/data/demo_opatra.fdb';

const method = process.argv[2] ?? '';
if (!/^[A-Za-z0-9_]+$/.test(method)) {
  console.error('Использование: pnpm api:describe <MethodName>   (например, WAGetItemMeta)');
  process.exit(1);
}

const sql = `SET LIST ON;
select m.methodname, m.sportname, m.description, p.paramname, p.direction
from api_methods m left join api_method_params p on p.api_methodsid = m.id
where m.methodname_upper = upper('${method}')
order by p.direction desc, p.ordernumber;
`;

let output: string;
try {
  // База в кодировке NONE, строки — байты cp1251: забираем как есть и декодируем сами.
  const raw = execFileSync(
    'docker',
    ['compose', 'exec', '-T', 'firebird', '/usr/local/firebird/bin/isql', '-u', 'SYSDBA', '-p', 'masterkey', DB_PATH],
    { cwd: BACKEND_DIR, input: sql },
  );
  output = new TextDecoder('windows-1251').decode(raw);
} catch {
  console.error(`Не удалось выполнить запрос. Бэкенд запущен? cd ${BACKEND_DIR} && docker compose up -d firebird api`);
  process.exit(1);
}

const records = output
  .split(/\n\s*\n/)
  .map((block) => {
    const record: Record<string, string> = {};
    for (const line of block.split('\n')) {
      const match = /^(\w+)\s+(.*)$/.exec(line.trim());
      if (match?.[1] && match[2] !== undefined) record[match[1]] = match[2].trim();
    }
    return record;
  })
  .filter((r) => r.METHODNAME);

const first = records[0];
if (!first) {
  console.error(`Метода ${method} нет в API_METHODS — бэкенд оборвёт соединение на такой запрос.`);
  process.exit(1);
}

const params = (direction: string) =>
  records.filter((r) => r.DIRECTION === direction && r.PARAMNAME && r.PARAMNAME !== '<null>').map((r) => r.PARAMNAME);

console.log(`${first.METHODNAME} → процедура ${(first.SPORTNAME ?? '').toUpperCase()}`);
if (first.DESCRIPTION && first.DESCRIPTION !== '<null>') console.log(first.DESCRIPTION);
console.log(`\nВход (${params('1').length}):  ${params('1').join(', ') || '—'}`);
console.log(`Выход (${params('0').length}): ${params('0').join(', ') || '—'}`);
console.log('\nВсе значения уходят строками; пустое значение бэкенд превращает в NULL.');
