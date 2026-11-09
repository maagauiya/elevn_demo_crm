import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { useCurrentUser } from '@/features/auth';
import { apiField, callApi } from '@/shared/api';

const typeSchema = z
  .object({ ID: apiField.int, TYPEGROUPID: apiField.int, NAME: z.string(), GROUPNAME: z.string() })
  .transform((r) => ({ id: r.ID, groupId: r.TYPEGROUPID, name: r.NAME.trim(), groupName: r.GROUPNAME.trim() }));

export type NotificationType = z.output<typeof typeSchema>;

const notificationSchema = z
  .object({
    ID: apiField.int,
    WANOTIFICATIONTYPEID: apiField.int,
    MSGTEXT: z.string().nullish(),
    RECID: apiField.optionalString,
    CLIENTID: apiField.optionalString,
    OPERATIONDATE: z.string().nullish(),
    TYPEGROUPID: apiField.optionalString,
  })
  .transform((r) => ({
    id: r.ID,
    typeId: r.WANOTIFICATIONTYPEID,
    text: r.MSGTEXT?.trim() ?? '',
    recordId: r.RECID && r.RECID !== '0' ? Number(r.RECID) : null,
    clientId: r.CLIENTID && r.CLIENTID !== '0' ? Number(r.CLIENTID) : null,
    at: r.OPERATIONDATE?.trim() ?? '',
  }));

export type Notification = z.output<typeof notificationSchema>;

/** Все группы — TypeGroupId = -1 (GroupTypes.All старого фронта). */
const ALL_GROUPS = -1;
const LIST_POLL_MS = 60_000;
const FLOAT_POLL_MS = 30_000;

export function useNotificationTypes() {
  const user = useCurrentUser();
  const { i18n } = useTranslation();
  return useQuery({
    queryKey: ['notifications', 'types', i18n.language],
    staleTime: Infinity,
    queryFn: ({ signal }) => callApi('WANGetTypeList', { UserId: user.userId }, { schema: typeSchema, signal }),
  });
}

export function useNotifications() {
  const user = useCurrentUser();
  return useQuery({
    queryKey: ['notifications', 'list'],
    refetchInterval: LIST_POLL_MS,
    queryFn: ({ signal }) =>
      callApi(
        'WANGetNotificationList',
        { UserId: user.userId, TypeGroupId: ALL_GROUPS },
        { schema: notificationSchema, signal },
      ),
  });
}

/** Очередь всплывающих уведомлений (WANGetNotificationListTF). */
export function useFloatingQueue() {
  const user = useCurrentUser();
  return useQuery({
    queryKey: ['notifications', 'floating'],
    refetchInterval: FLOAT_POLL_MS,
    refetchIntervalInBackground: false,
    queryFn: ({ signal }) =>
      callApi('WANGetNotificationListTF', { UserId: user.userId }, { schema: notificationSchema, signal }),
  });
}

const resultSchema = z.unknown();

export function useMarkFloated() {
  const user = useCurrentUser();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      callApi(
        'WANSetNotificationFloated',
        { UserId: user.userId, ParentId: id },
        { schema: resultSchema, retry: false },
      ),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

const appDateSchema = z.object({ APPDATE: z.string() }).transform((r) => r.APPDATE.trim());

/** Дата записи по её id (WASGetAppBID) — чтобы открыть уведомление в журнале. */
export async function appointmentDate(userId: number, appointmentId: number): Promise<string | null> {
  const [date] = await callApi('WASGetAppBID', { UserId: userId, AppId: appointmentId }, { schema: appDateSchema });
  if (!date) return null;
  const ru = /^(\d{2})\.(\d{2})\.(\d{4})/.exec(date);
  if (ru) return `${ru[3]}-${ru[2]}-${ru[1]}`;
  return /^\d{4}-\d{2}-\d{2}/.exec(date)?.[0] ?? null;
}
