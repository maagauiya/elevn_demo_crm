import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { useCurrentUser } from '@/features/auth';
import { apiField, callApi } from '@/shared/api';
import { type Engine, engineOf, FOLDER_TYPE, itemPath } from '../model/item-types';

/**
 * Строка WAGetNav (процедура WA_GET_NAV: таблицы WANAV + WAPANE + WAITEM + WANAVDETAILS).
 * ВАЖНО: RECID неуникален — у папок это WANAV.ID, у пунктов WAITEM.ID. Уникальный ключ — WANAVID,
 * родитель — NPRECID (WANAVID папки, 0 — корень).
 */
const navRowSchema = z
  .object({
    RECID: apiField.int,
    RECTYPE: apiField.int,
    RECNAME: z.string(),
    RECICON: z.string().nullish(),
    METHODNAME: apiField.optionalString,
    HASDETAILS: apiField.bool,
    EDITORTABLE: apiField.optionalString,
    EMETHODNAME: apiField.optionalString,
    WINPUTPARAMS: apiField.optionalString,
    DEFAULTBONCLICK: apiField.optionalString,
    ISVISIBLE: apiField.bool,
    ISEDITABLE: apiField.bool,
    NPRECID: apiField.int,
    WANAVID: apiField.int,
  })
  .transform((row) => ({
    key: row.WANAVID,
    parentKey: row.NPRECID,
    itemId: row.RECID,
    type: row.RECTYPE,
    isFolder: row.RECTYPE === FOLDER_TYPE,
    name: row.RECNAME,
    /** Имя файла иконки (document.svg). Сами svg с внешнего домена не грузим. */
    icon: row.RECICON?.split('/').at(-1) ?? null,
    visible: row.ISVISIBLE,
    editable: row.ISEDITABLE,
    methodName: row.METHODNAME,
    editorTable: row.EDITORTABLE,
    editMethodName: row.EMETHODNAME,
    inputParams: row.WINPUTPARAMS,
    defaultButtonId: row.DEFAULTBONCLICK,
  }));

export type NavRow = z.output<typeof navRowSchema>;

export interface NavItem extends NavRow {
  kind: 'item';
  engine: Engine;
  path: string;
}

export interface NavFolder {
  kind: 'folder';
  key: number;
  name: string;
  icon: string | null;
  children: NavNode[];
}

export type NavNode = NavItem | NavFolder;

export interface NavMenu {
  tree: NavNode[];
  /** Все видимые пункты (без папок) в порядке меню — для поиска и поиска по itemId. */
  items: NavItem[];
}

/** Собирает дерево: скрытые пункты, пункты неизвестного типа и пустые папки отбрасываются. */
export function buildNavMenu(rows: NavRow[]): NavMenu {
  const byParent = new Map<number, NavRow[]>();
  for (const row of rows) {
    if (!row.visible) continue;
    const siblings = byParent.get(row.parentKey) ?? [];
    siblings.push(row);
    byParent.set(row.parentKey, siblings);
  }

  const items: NavItem[] = [];
  const build = (parentKey: number): NavNode[] =>
    (byParent.get(parentKey) ?? []).flatMap((row): NavNode[] => {
      if (row.isFolder) {
        const children = build(row.key);
        return children.length ? [{ kind: 'folder', key: row.key, name: row.name, icon: row.icon, children }] : [];
      }
      const engine = engineOf(row.type);
      const path = itemPath(row.type, row.itemId);
      if (!engine || !path) {
        if (import.meta.env.DEV) console.warn(`[nav] неизвестный тип пункта ${row.type}: «${row.name}»`);
        return [];
      }
      const item: NavItem = { ...row, kind: 'item', engine, path };
      items.push(item);
      return [item];
    });

  return { tree: build(0), items };
}

export function useNavMenu() {
  const user = useCurrentUser();
  const { i18n } = useTranslation();
  return useQuery({
    // Названия пунктов приходят с сервера на языке LangId — язык входит в ключ.
    queryKey: ['navigation', 'menu', { userId: user.userId, lang: i18n.language }],
    queryFn: ({ signal }) =>
      callApi(
        'WAGetNav',
        { UserId: user.userId, UserRoleId: user.role, PRecId: 0, IsWholeNav: 1 },
        { schema: navRowSchema, signal, checkRowResult: false },
      ),
    select: buildNavMenu,
    staleTime: Infinity,
  });
}

/** Пункт меню по WAITEM.ID — экраны-движки берут из него METHODNAME, EDITORTABLE и т.д. */
export function useNavItem(itemId: number | undefined) {
  const menu = useNavMenu();
  const item = itemId === undefined ? undefined : menu.data?.items.find((i) => i.itemId === itemId);
  return { ...menu, item };
}
