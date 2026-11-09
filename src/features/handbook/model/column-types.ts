/**
 * Типы полей движка таблиц (WAGetItemMeta.FTYPEID, WAGetItemParams.FIELDTYPEID — общая нумерация,
 * источник — старый фронт: redux/table/utils.tsx checkTypes + components/common/generators/form/getInputFromType).
 */
export type FieldTypeId = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '40';

export type CellKind = 'number' | 'date' | 'datetime' | 'time' | 'multiline' | 'text';

const KIND_BY_TYPE: Record<string, CellKind> = {
  '1': 'number', // integer
  '3': 'number', // decimal
  '5': 'multiline',
  '40': 'multiline',
  '6': 'date',
  '7': 'datetime',
  '9': 'time',
};

export function cellKind(typeId: string): CellKind {
  return KIND_BY_TYPE[typeId] ?? 'text';
}

/** Бэкенд отдаёт числа и даты строками; значения с пробелами ("Да ") — тоже бэкенд, подчищаем. */
export function formatCellValue(typeId: string, value: string | null, lang: string): string {
  if (value === null) return '';
  const trimmed = value.trim();
  if (trimmed === '') return '';
  switch (cellKind(typeId)) {
    case 'number': {
      const num = Number(trimmed);
      // toLocaleString разделяет тысячи неразрывным пробелом (U+00A0) — меняем на обычный, чтобы не ломать поиск/копирование.
      return Number.isNaN(num)
        ? trimmed
        : num.toLocaleString(lang === 'en' ? 'en-US' : 'ru-RU').replace(/\u00a0/g, ' ');
    }
    case 'date':
    case 'datetime': {
      const date = parseBackendDate(trimmed);
      if (!date) return trimmed;
      const pattern = cellKind(typeId) === 'datetime' ? 'dd.MM.yyyy HH:mm' : 'dd.MM.yyyy';
      return formatDateWithPattern(date, pattern);
    }
    default:
      return trimmed;
  }
}

/** Бэкенд отдаёт дату как "YYYY-MM-DD" или "YYYY-MM-DD HH:MM:SS[.ffff]". */
function parseBackendDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(value);
  if (!match) return null;
  const [, y, m, d, hh = '0', mm = '0', ss = '0'] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), Number(ss));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Формат dd.MM.yyyy одинаковый для ru/en в этом продукте — локаль не меняет порядок. */
function formatDateWithPattern(date: Date, pattern: string): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const base = `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
  return pattern.includes('HH:mm') ? `${base} ${pad(date.getHours())}:${pad(date.getMinutes())}` : base;
}

export type SummaryType = '0' | '1' | '2' | '3' | '4' | '5';

export const SUMMARY_LABEL_KEY = {
  '0': 'summary.max',
  '1': 'summary.min',
  '2': 'summary.sum',
  '3': 'summary.count',
  '4': 'summary.avg',
  '5': 'summary.countUniq',
} as const satisfies Record<SummaryType, string>;

/** Итог по колонке. Нечисловые значения считают только count/countUniq. */
export function aggregate(summaryType: string, values: (string | null)[]): number | null {
  const nonEmpty = values.map((v) => v?.trim() ?? '').filter((v) => v !== '');
  switch (summaryType) {
    case '3': // count
      return nonEmpty.length;
    case '5': // count uniq
      return new Set(nonEmpty).size;
    default:
      break;
  }
  const numbers = nonEmpty.map(Number).filter((n) => !Number.isNaN(n));
  if (numbers.length === 0) return null;
  switch (summaryType) {
    case '0': // max
      return Math.max(...numbers);
    case '1': // min
      return Math.min(...numbers);
    case '2': // sum
      return numbers.reduce((a, b) => a + b, 0);
    case '4': // avg
      return numbers.reduce((a, b) => a + b, 0) / numbers.length;
    default:
      return null;
  }
}
