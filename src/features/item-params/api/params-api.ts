import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { useCurrentUser } from '@/features/auth';
import { apiField, callApi } from '@/shared/api';

/**
 * Входные параметры пункта меню (WINPUTPARAMS): WAGetItemParams → описание полей,
 * WAGetItemParamDict → варианты для полей-справочников (FieldTypeId = 10).
 */
const paramRowSchema = z
  .object({
    DBFIELDNAME: z.string(),
    CAPTION: z.string(),
    FIELDTYPEID: apiField.int,
    STRINGMAXLEN: apiField.optionalString,
    DICTNAME: apiField.optionalString,
    DICTTYPE: apiField.optionalString,
    WUSERID: apiField.bool,
    DEFAULTVALUE: apiField.optionalString,
  })
  .transform((row) => ({
    name: row.DBFIELDNAME,
    caption: row.CAPTION,
    type: row.FIELDTYPEID,
    maxLength: row.STRINGMAXLEN ? Number(row.STRINGMAXLEN) : null,
    dictName: row.DICTNAME,
    dictType: row.DICTTYPE ?? '0',
    withUser: row.WUSERID,
    defaultValue: row.DEFAULTVALUE,
  }));

export type ItemParam = z.output<typeof paramRowSchema>;

const dictRowSchema = z
  .object({ DICTID: z.string(), DICTVALUE: z.string() })
  .transform((row) => ({ value: row.DICTID, label: row.DICTVALUE.trim() }));

export type DictOption = z.output<typeof dictRowSchema>;

export function useItemParams(itemId: number | undefined) {
  const user = useCurrentUser();
  const { i18n } = useTranslation();
  return useQuery({
    queryKey: ['item-params', 'fields', { itemId, lang: i18n.language }],
    queryFn: ({ signal }) =>
      callApi('WAGetItemParams', { UserId: user.userId, WAItemId: itemId }, { schema: paramRowSchema, signal }),
    enabled: itemId !== undefined,
    staleTime: Infinity,
  });
}

export function useParamDict(param: ItemParam) {
  const user = useCurrentUser();
  return useQuery({
    queryKey: ['item-params', 'dict', { name: param.dictName, type: param.dictType, withUser: param.withUser }],
    queryFn: ({ signal }) =>
      callApi(
        'WAGetItemParamDict',
        { UserId: user.userId, DictName: param.dictName, DictType: param.dictType, WUserId: param.withUser ? 1 : 0 },
        { schema: dictRowSchema, signal },
      ),
    enabled: Boolean(param.dictName),
    staleTime: 5 * 60_000,
  });
}
