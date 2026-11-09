import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { useCurrentUser } from '@/features/auth';
import { apiField, callApi } from '@/shared/api';

/**
 * Колонки таблицы раздела (процедура WA_GET_ITEMMETA, контракт — pnpm api:describe WAGetItemMeta).
 * FNAME совпадает (без учёта регистра) с именем поля, которое возвращает METHODNAME самого раздела.
 */
const metaRowSchema = z
  .object({
    FID: apiField.int,
    FNAME: z.string(),
    FCAPTION: z.string(),
    FISVISBLE: apiField.bool,
    FTYPEID: z.string(),
    FORDERNUMBER: apiField.int,
    FILTERTYPEID: z.string(),
    GROUPINGLVL: apiField.optionalString,
    SUMMARYTYPE: apiField.optionalString,
  })
  .transform((row) => ({
    id: row.FID,
    name: row.FNAME.toUpperCase(),
    caption: row.FCAPTION,
    visible: row.FISVISBLE,
    typeId: row.FTYPEID,
    order: row.FORDERNUMBER,
    filterTypeId: row.FILTERTYPEID,
    groupingLevel: row.GROUPINGLVL === null ? null : Number(row.GROUPINGLVL),
    summaryType: row.SUMMARYTYPE,
  }));

export type ColumnMeta = z.output<typeof metaRowSchema>;

export function useItemMeta(itemId: number) {
  const user = useCurrentUser();
  const { i18n } = useTranslation();
  return useQuery({
    queryKey: ['handbook', 'item-meta', { itemId, userId: user.userId, lang: i18n.language }],
    queryFn: ({ signal }) =>
      callApi(
        'WAGetItemMeta',
        { UserId: user.userId, UserRoleId: user.role, WAItemId: itemId },
        { schema: metaRowSchema, signal, checkRowResult: false },
      ),
    select: (rows) => rows.filter((row) => row.visible).sort((a, b) => a.order - b.order),
    staleTime: Infinity,
  });
}

/**
 * Входные параметры раздела (WA_GET_ITEMPARAMS). Пустой список — раздел открывается без диалога параметров.
 */
const paramRowSchema = z
  .object({
    DBFIELDNAME: z.string(),
    CAPTION: z.string(),
    FIELDTYPEID: z.string(),
    STRINGMAXLEN: apiField.optionalString,
    DICTNAME: apiField.optionalString,
    DICTTYPE: apiField.optionalString,
    WUSERID: apiField.optionalString,
    DEFAULTVALUE: apiField.optionalString,
  })
  .transform((row) => ({
    name: row.DBFIELDNAME.toUpperCase(),
    caption: row.CAPTION,
    typeId: row.FIELDTYPEID,
    maxLength: row.STRINGMAXLEN ? Number(row.STRINGMAXLEN) : null,
    dictName: row.DICTNAME,
    dictType: row.DICTTYPE,
    wUserId: row.WUSERID,
    defaultValue: row.DEFAULTVALUE,
  }));

export type ParamField = z.output<typeof paramRowSchema>;

export function useItemParams(itemId: number) {
  const user = useCurrentUser();
  const { i18n } = useTranslation();
  return useQuery({
    queryKey: ['handbook', 'item-params', { itemId, userId: user.userId, lang: i18n.language }],
    queryFn: ({ signal }) =>
      callApi(
        'WAGetItemParams',
        { UserId: user.userId, WAItemId: itemId },
        { schema: paramRowSchema, signal, checkRowResult: false },
      ),
    staleTime: Infinity,
  });
}

/** Справочник для параметра с FIELDTYPEID=10 (WA_GET_ITEMPARAMDICT). */
const dictRowSchema = z
  .object({ DICTID: z.string(), DICTVALUE: z.string() })
  .transform((row) => ({ id: row.DICTID, value: row.DICTVALUE }));

export function useItemParamDict(
  field: Pick<ParamField, 'dictName' | 'dictType' | 'wUserId'> | null,
  enabled: boolean,
) {
  const user = useCurrentUser();
  return useQuery({
    queryKey: ['handbook', 'item-param-dict', field],
    queryFn: ({ signal }) =>
      callApi(
        'WAGetItemParamDict',
        { UserId: user.userId, DictName: field?.dictName, DictType: field?.dictType, WUserId: field?.wUserId },
        { schema: dictRowSchema, signal, checkRowResult: false },
      ),
    enabled: enabled && !!field?.dictName,
    staleTime: Infinity,
  });
}

/**
 * Данные раздела — метод берётся из WAGetNav (methodName пункта меню). Выход у каждого метода свой,
 * поэтому строка — произвольный набор строковых полей; состав и подпись колонок даёт useItemMeta.
 */
const genericRowSchema = z.record(z.string(), z.union([z.string(), z.null()]).optional());

export type TableRow = Record<string, string | null | undefined>;

export function useItemData(
  itemId: number,
  methodName: string | null | undefined,
  paramValues: Record<string, string> | null,
) {
  const user = useCurrentUser();
  return useQuery({
    queryKey: ['handbook', 'item-data', { itemId, methodName, paramValues }],
    queryFn: ({ signal }) =>
      callApi(
        methodName ?? '',
        { UserId: user.userId, ...paramValues },
        { schema: genericRowSchema, signal, checkRowResult: false },
      ),
    enabled: !!methodName && paramValues !== null,
  });
}
