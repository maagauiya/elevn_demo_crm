import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { useCurrentUser } from '@/features/auth';
import type { ParamValues } from '@/features/item-params';
import { apiField, callApi } from '@/shared/api';
import type { Row } from '../model/parse';

/** WAGetDashContent: виджеты дашборда. Ширина — из 12 колонок, высота — в условных единицах. */
const widgetRowSchema = z
  .object({
    WAITEMID: apiField.int,
    ITEMWIDTH: z.string(),
    ITEMHEIGHT: z.string(),
    ITEMTYPEID: apiField.int,
    CAPTION: z.string().nullish(),
    METHODNAME: z.string(),
  })
  .transform((row) => ({
    id: row.WAITEMID,
    // Бывает "8;12" (lg;md) — берём первое значение.
    width: Math.min(12, Math.max(1, Number(row.ITEMWIDTH.split(';')[0]) || 12)),
    height: Math.max(1, Number(row.ITEMHEIGHT.split(';')[0]) || 2),
    type: row.ITEMTYPEID,
    caption: row.CAPTION?.trim() ?? '',
    method: row.METHODNAME,
  }));

export type Widget = z.output<typeof widgetRowSchema>;

const rowSchema = z.record(z.string(), z.string().nullish());

export function useDashContent(itemId: number | undefined) {
  const user = useCurrentUser();
  const { i18n } = useTranslation();
  return useQuery({
    queryKey: ['dashboard', 'content', { itemId, lang: i18n.language }],
    enabled: itemId !== undefined,
    staleTime: Infinity,
    queryFn: ({ signal }) =>
      callApi('WAGetDashContent', { UserId: user.userId, DashId: itemId }, { schema: widgetRowSchema, signal }),
  });
}

/** Данные одного виджета: его METHODNAME с входными параметрами дашборда. */
export function useWidgetData(method: string, params: ParamValues, enabled: boolean) {
  const user = useCurrentUser();
  const { i18n } = useTranslation();
  return useQuery({
    queryKey: ['dashboard', 'widget', { method, params, lang: i18n.language }],
    enabled,
    queryFn: ({ signal }): Promise<Row[]> =>
      callApi(method, { UserId: user.userId, ...params }, { schema: rowSchema, signal, checkRowResult: false }),
  });
}
