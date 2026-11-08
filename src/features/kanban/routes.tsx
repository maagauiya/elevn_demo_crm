import type { RouteObject } from 'react-router';

/** Канбан (тип пункта 12, например «Сделки (канбан)» → WAKBBDeal). В старом фронте не было. */
export const kanbanRoutes: RouteObject[] = [
  { path: 'kanban/:itemId', lazy: async () => ({ Component: (await import('./pages/KanbanPage')).KanbanPage }) },
];
