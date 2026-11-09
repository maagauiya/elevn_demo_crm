import type { ColumnMeta } from '../api/table-meta';
import { cellKind } from './column-types';

export interface TableColumnDef {
  id: string;
  caption: string;
  typeId: string;
  /** '0' — без фильтра, '1' — текстовый, иначе — выбор из значений, встреченных в данных. */
  filterTypeId: string;
  summaryType: string | null;
  size: number;
}

const DEFAULT_SIZE_BY_KIND: Record<string, number> = {
  number: 100,
  date: 110,
  datetime: 150,
  time: 90,
  multiline: 240,
};

/** ~ширина символа text-label (13.5px, вес 600) + сортировка/закреп в той же строке заголовка. */
const CHAR_WIDTH_PX = 8;
const HEADER_CHROME_PX = 64;

/** Ширина по умолчанию не должна обрезать подпись колонки заголовка — иначе текст режется. */
function widthForCaption(caption: string): number {
  return caption.length * CHAR_WIDTH_PX + HEADER_CHROME_PX;
}

/** Видимые колонки раздела, в порядке FORDERNUMBER, с шириной по умолчанию по типу поля и подписи. */
export function buildColumns(meta: ColumnMeta[]): TableColumnDef[] {
  return meta
    .filter((col) => col.visible)
    .map((col) => ({
      id: col.name,
      caption: col.caption,
      typeId: col.typeId,
      filterTypeId: col.filterTypeId,
      summaryType: col.summaryType,
      size: Math.max(DEFAULT_SIZE_BY_KIND[cellKind(col.typeId)] ?? 160, widthForCaption(col.caption)),
    }));
}
