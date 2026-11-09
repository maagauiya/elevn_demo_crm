/** Ячейка графика: специалист × день (ISO-дата). */
export interface CellRef {
  docId: number;
  date: string;
}

export const cellKey = (c: CellRef) => `${c.docId},${c.date}`;

/** Прямоугольник от якоря до текущей ячейки по порядку строк и столбцов (как выделение в таблице). */
export function rectangle(anchor: CellRef, current: CellRef, docIds: number[], dates: string[]): CellRef[] {
  const r1 = docIds.indexOf(anchor.docId);
  const r2 = docIds.indexOf(current.docId);
  const c1 = dates.indexOf(anchor.date);
  const c2 = dates.indexOf(current.date);
  if (r1 < 0 || r2 < 0 || c1 < 0 || c2 < 0) return [];
  const cells: CellRef[] = [];
  for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r += 1) {
    for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c += 1) {
      const docId = docIds[r];
      const date = dates[c];
      if (docId !== undefined && date !== undefined) cells.push({ docId, date });
    }
  }
  return cells;
}

/**
 * DocDateList для WATT*: "docId,ISO-дата;docId,ISO-дата;" (формат старого фронта).
 * Режем на порции: параметр процедуры — VARCHAR(16383).
 */
export function docDateLists(cells: CellRef[], chunk = 500): string[] {
  const sorted = [...cells].sort((a, b) => a.docId - b.docId || a.date.localeCompare(b.date));
  const lists: string[] = [];
  for (let i = 0; i < sorted.length; i += chunk) {
    lists.push(
      sorted
        .slice(i, i + chunk)
        .map((c) => `${cellKey(c)};`)
        .join(''),
    );
  }
  return lists;
}

/** TimeList: "10:00:00-14:00:00,15:00:00-19:00:00". */
export function timeList(ranges: { from: string; to: string }[]): string {
  const sec = (t: string) => (t.length === 5 ? `${t}:00` : t);
  return ranges.map((r) => `${sec(r.from)}-${sec(r.to)}`).join(',');
}
