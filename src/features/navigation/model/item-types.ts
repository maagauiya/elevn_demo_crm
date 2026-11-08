/**
 * Типы пунктов меню (WAITEM.ITEMTYPEID, в WAGetNav — RECTYPE) → движок экрана.
 * Источник — старый фронт (redux/menu/utils.ts → getPathFromRecType) + таблица WAITEM в базе.
 * Файл без алиасов и зависимостей: его импортирует и приложение, и scripts/sync-metadata.ts.
 */
export type Engine = 'logbook' | 'offices' | 'training' | 'work-schedule' | 'table' | 'chart' | 'dashboard' | 'kanban';

export const FOLDER_TYPE = 0;

const ENGINE_BY_TYPE = new Map<number, Engine>([
  [-1, 'logbook'],
  [-3, 'logbook'],
  [-10, 'offices'],
  [-100, 'training'],
  [-2, 'work-schedule'],
  // Универсальная таблица: колонки, фильтры, кнопки, редактор приходят из базы
  [1, 'table'],
  [7, 'table'],
  [9, 'table'],
  [10, 'table'],
  // Графики и виджеты
  [2, 'chart'],
  [3, 'chart'],
  [4, 'chart'],
  [5, 'chart'],
  [8, 'chart'],
  [11, 'chart'],
  [6, 'dashboard'],
  [12, 'kanban'],
]);

/** Кто отвечает за движок (см. план: трек A — время и записи + графики, трек B — таблицы и данные). */
export const ENGINE_TRACK: Record<Engine, 'A' | 'B'> = {
  logbook: 'A',
  offices: 'A',
  training: 'A',
  'work-schedule': 'A',
  chart: 'A',
  dashboard: 'A',
  table: 'B',
  kanban: 'B',
};

export function engineOf(type: number): Engine | null {
  return ENGINE_BY_TYPE.get(type) ?? null;
}

/** Маршрут пункта меню. itemId — WAITEM.ID (RECID в WAGetNav). */
export function itemPath(type: number, itemId: number): string | null {
  switch (engineOf(type)) {
    case 'logbook':
      return '/logbook';
    case 'offices':
      return '/offices';
    case 'training':
      return '/training';
    case 'work-schedule':
      return '/work_schedule';
    case 'table':
      return `/info/${itemId}`;
    case 'chart':
      return `/chart/${itemId}`;
    case 'dashboard':
      return `/dashboard/${itemId}`;
    case 'kanban':
      return `/kanban/${itemId}`;
    case null:
      return null;
  }
}
