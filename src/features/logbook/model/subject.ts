/**
 * APPSUB — многострочная подпись записи, которую собирает процедура:
 *   "<комментарий> <ФИО клиента> <телефон> <карта>\n<услуга>\n<услуга>\n<название статуса>\n"
 * Первая строка — шапка, последняя непустая — статус, между ними — услуги.
 */
export function parseSubject(subject: string): { services: string[]; statusName: string | null } {
  const lines = subject
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return { services: [], statusName: null };
  return { services: lines.slice(1, -1), statusName: lines.at(-1) ?? null };
}

/**
 * CLIENTNAME — «ФИО  телефон» (два пробела перед телефоном). Делим, чтобы показать телефон отдельно.
 */
export function splitClientName(value: string): { name: string; phone: string | null } {
  const match = /^(.*?)\s{2,}(\+?\d[\d\s()-]{5,})\s*$/.exec(value);
  if (!match) return { name: value.trim(), phone: null };
  return { name: (match[1] ?? '').trim(), phone: (match[2] ?? '').trim() };
}
