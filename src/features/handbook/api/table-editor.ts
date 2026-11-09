import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { useCurrentUser } from '@/features/auth';
import { apiField, callApi } from '@/shared/api';

/**
 * Поля редактора записи (WA_GET_ITEMEDITOR, контракт — pnpm api:describe WAGetItemEditor).
 * EditorTable — из WAGetNav (EDITORTABLE пункта меню).
 */
const editorFieldSchema = z
  .object({
    DBFIELDNAME: z.string(),
    CAPTION: z.string(),
    ISREADONLY: apiField.bool,
    ORDERNUMBER: apiField.int,
    ISBOOL: apiField.bool,
    ISPASSWORD: apiField.bool,
    MULTITEXT: apiField.bool,
    ISPHONE: apiField.bool,
    FIELDTYPEID: z.string(),
    STRINGMAXLEN: apiField.optionalString,
    FKTABLE: apiField.optionalString,
    FKFIELD: apiField.optionalString,
    EPANECAPTION: apiField.optionalString,
  })
  .transform((row) => ({
    name: row.DBFIELDNAME.toUpperCase(),
    caption: row.CAPTION,
    readOnly: row.ISREADONLY,
    order: row.ORDERNUMBER,
    isBool: row.ISBOOL,
    isPassword: row.ISPASSWORD,
    multiline: row.MULTITEXT,
    isPhone: row.ISPHONE,
    // У WAGetItemEditor справочника (DictName/DictType) нет — связь через FK, пикер для типа 10 не делали.
    dictName: null,
    dictType: null,
    wUserId: null,
    typeId: row.FIELDTYPEID,
    maxLength: row.STRINGMAXLEN ? Number(row.STRINGMAXLEN) : null,
    paneCaption: row.EPANECAPTION,
  }));

export type EditorField = z.output<typeof editorFieldSchema>;

export function useEditorFields(editorTable: string | null | undefined) {
  const user = useCurrentUser();
  const { i18n } = useTranslation();
  return useQuery({
    queryKey: ['handbook', 'editor-fields', { editorTable, lang: i18n.language }],
    queryFn: ({ signal }) =>
      callApi(
        'WAGetItemEditor',
        { UserId: user.userId, UserRoleId: user.role, EditorTable: editorTable },
        { schema: editorFieldSchema, signal, checkRowResult: false },
      ),
    select: (rows) => [...rows].sort((a, b) => a.order - b.order),
    enabled: !!editorTable,
    staleTime: Infinity,
  });
}

/** Значения полей существующей записи (WA_GET_EDITORDATA). Пустой Id — пустой ответ (новая запись). */
const editorValueSchema = z
  .object({ DBFIELDNAME: z.string(), FIELDVALUE: apiField.optionalString, FIELDFKVALUE: apiField.optionalString })
  .transform((row) => ({ name: row.DBFIELDNAME.toUpperCase(), value: row.FIELDVALUE, fkValue: row.FIELDFKVALUE }));

export function useEditorData(editorTable: string | null | undefined, id: string | undefined) {
  const user = useCurrentUser();
  return useQuery({
    queryKey: ['handbook', 'editor-data', { editorTable, id }],
    queryFn: ({ signal }) =>
      callApi(
        'WAGetEditorData',
        { UserId: user.userId, UserRoleId: user.role, EditorTable: editorTable, Id: id },
        { schema: editorValueSchema, signal, checkRowResult: false },
      ),
    enabled: !!editorTable && !!id,
  });
}

/** Ответ и WAEditTable, и большинства EMETHODNAME — Result/ResultDescription строкой. */
const editResultSchema = z.object({ RESULT: apiField.int, RESULTDESCRIPTION: apiField.optionalString });

export interface SaveRecordInput {
  editorTable: string;
  /** Метод сохранения из WAGetNav.EMETHODNAME. У большинства разделов это WAEditTable. */
  editMethodName: string;
  /** undefined — создание новой записи. */
  id: string | undefined;
  changedFields: Record<string, string>;
}

/**
 * WAEditTable принимает до 10 изменённых полей за вызов, каждое — строкой "ИМЯ;;;ЗНАЧЕНИЕ"
 * в ParamValue/ParamValue2…ParamValue10 (см. старый фронт: forms/editor/utils/functions.tsx).
 */
export function chunkParamValues(fields: Record<string, string>): Record<string, string>[] {
  const entries = Object.entries(fields);
  const chunks: Record<string, string>[] = [];
  for (let i = 0; i < entries.length; i += 10) {
    const chunk: Record<string, string> = {};
    entries.slice(i, i + 10).forEach(([name, value], idx) => {
      chunk[idx === 0 ? 'ParamValue' : `ParamValue${idx + 1}`] = `${name};;;${value}`;
    });
    chunks.push(chunk);
  }
  return chunks;
}

/**
 * Сохранение записи. Если EMETHODNAME раздела — не WAEditTable (например WAEditUser,
 * WAEditMedcard), вызываем его прямо с именованными полями, как делал старый фронт.
 */
export function useSaveRecord() {
  const user = useCurrentUser();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ editorTable, editMethodName, id, changedFields }: SaveRecordInput) => {
      if (editMethodName !== 'WAEditTable') {
        await callApi(editMethodName, { UserId: user.userId, Id: id, ...changedFields }, { schema: editResultSchema });
        return;
      }
      const chunks = chunkParamValues(changedFields);
      for (const chunk of chunks.length ? chunks : [{}]) {
        await callApi(
          'WAEditTable',
          { UserId: user.userId, Id: id, TableName: editorTable, ...chunk },
          { schema: editResultSchema },
        );
      }
    },
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['handbook', 'item-data'] });
      void queryClient.invalidateQueries({
        queryKey: ['handbook', 'editor-data', { editorTable: variables.editorTable, id: variables.id }],
      });
    },
  });
}
