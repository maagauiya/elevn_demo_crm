/**
 * Разбор ответов методов виджетов (WAChart*). Формы ответов — по типу виджета (ITEMTYPEID):
 *  2, 3 — серии: строка = серия, LABEL и поле значений — JSON-массивы в строке, TITLE — имя серии;
 *  4    — сектора: LABEL + одно числовое поле;
 *  5    — показатели: LABEL + PARAMVALUE (строка, может быть «12%»);
 *  8    — рейтинг: PARAMNAME, PARAMVALUE, PARAMORDER;
 *  11   — медзаписи (WAMF*): список записей.
 * Цвета с сервера (ITEMCOLOR) игнорируем — палитра из дизайн-системы.
 */
export type Row = Record<string, string | null | undefined>;

const SERVICE_KEYS = new Set(['LABEL', 'TITLE', 'ITEMCOLOR', 'ID', 'IMGURL', 'PARAMORDER', 'PARAMNAME']);

/** Поле значений — первое «не служебное» поле строки (PROCEEDS, WORKLOAD, DEPSUMMA…). */
export function valueKey(row: Row | undefined): string | null {
  if (!row) return null;
  return Object.keys(row).find((key) => !SERVICE_KEYS.has(key)) ?? null;
}

function parseArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [String(parsed)];
  } catch {
    return [value];
  }
}

export function toNumber(value: string | null | undefined): number {
  if (!value) return 0;
  const n = Number(value.replace('%', '').replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

export interface SeriesData {
  series: string[];
  points: Record<string, string | number>[];
}

export function parseSeries(rows: Row[]): SeriesData {
  const key = valueKey(rows[0]);
  if (!key) return { series: [], points: [] };
  const series = rows.map((row, i) => {
    const title = (row.TITLE ?? '').trim();
    return title.length > 0 ? title : `#${i + 1}`;
  });
  const labels = parseArray(rows[0]?.LABEL);
  const values = rows.map((row) => parseArray(row[key]).map((v) => toNumber(v)));
  const points = labels.map((label, i) => {
    const point: Record<string, string | number> = { label };
    series.forEach((name, s) => {
      point[name] = values[s]?.[i] ?? 0;
    });
    return point;
  });
  return { series, points };
}

export interface Slice {
  label: string;
  value: number;
}

export function parseSlices(rows: Row[]): Slice[] {
  const key = valueKey(rows[0]);
  if (!key) return [];
  return rows.map((row) => ({ label: row.LABEL?.trim() ?? '', value: toNumber(row[key]) }));
}

export interface Stat {
  label: string;
  value: string;
}

export function parseStats(rows: Row[]): Stat[] {
  return rows.map((row) => ({ label: row.LABEL?.trim() ?? '', value: row.PARAMVALUE?.trim() ?? '' }));
}

export interface RatingItem {
  name: string;
  value: number;
}

export function parseRating(rows: Row[]): RatingItem[] {
  return [...rows]
    .sort((a, b) => toNumber(a.PARAMORDER) - toNumber(b.PARAMORDER))
    .map((row) => ({ name: row.PARAMNAME?.trim() ?? '', value: toNumber(row.PARAMVALUE) }));
}

/** Число в компактном виде: 169 530 146 → «169,5 млн». */
export function formatCompact(value: number, lang = 'ru'): string {
  return new Intl.NumberFormat(lang, { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

export function formatFull(value: number, lang = 'ru'): string {
  return new Intl.NumberFormat(lang, { maximumFractionDigits: 2 }).format(value);
}
