import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useCurrentUser } from '@/features/auth';
import { apiField, callApi } from '@/shared/api';
import { greenApiGateway, unavailableGateway, type WhatsAppGateway } from '../model/gateway';
import { mockGateway } from '../model/mock-gateway';

/** WAGetMSGInstanceList. Токен не показываем в интерфейсе — только используем для запросов к шлюзу. */
const instanceSchema = z
  .object({
    ID: apiField.int,
    NAME: z.string(),
    WATOKEN: apiField.optionalString,
    DESCRIPTION: z.string().nullish(),
    ISDEFAULT: z.string().nullish(),
    INSTANCETYPENAME: z.string().nullish(),
  })
  .transform((r) => ({
    id: r.ID,
    name: r.NAME.trim(),
    token: r.WATOKEN,
    description: r.DESCRIPTION?.trim() ?? '',
    isDefault: (r.ISDEFAULT ?? '').trim().toLowerCase() === 'да',
    type: r.INSTANCETYPENAME?.trim() ?? 'WhatsApp',
  }));

export type Instance = z.output<typeof instanceSchema>;

let gateway: WhatsAppGateway | null = null;

/** Выбор шлюза — один раз за сессию страницы. */
export function getGateway(): WhatsAppGateway {
  if (gateway) return gateway;
  if (import.meta.env.VITE_API_MOCKS === 'true') gateway = mockGateway();
  else if (import.meta.env.VITE_WHATSAPP_DIRECT === 'true')
    gateway = greenApiGateway(import.meta.env.VITE_GREEN_API_URL ?? 'https://api.green-api.com');
  else gateway = unavailableGateway;
  return gateway;
}

export function useInstances() {
  const user = useCurrentUser();
  return useQuery({
    queryKey: ['messaging', 'instances'],
    queryFn: ({ signal }) =>
      callApi('WAGetMSGInstanceList', { UserId: user.userId }, { schema: instanceSchema, signal }),
  });
}

/** Токен инстанса для отправки: по умолчанию — помеченный ISDEFAULT, иначе первый с токеном. */
export function useDefaultToken(): string | null {
  const instances = useInstances();
  const list = instances.data ?? [];
  return (list.find((i) => i.isDefault && i.token) ?? list.find((i) => i.token))?.token ?? null;
}

export function useInstanceStatus(token: string | null) {
  return useQuery({
    queryKey: ['messaging', 'status', token],
    enabled: Boolean(token) && getGateway().available,
    refetchInterval: 30_000,
    queryFn: async () => {
      const gw = getGateway();
      const [state, queue] = await Promise.all([gw.state(token ?? ''), gw.queueSize(token ?? '')]);
      return { state, queue };
    },
  });
}

export function useChat(token: string | null, phone: string) {
  return useQuery({
    queryKey: ['messaging', 'chat', { token, phone }],
    enabled: Boolean(token) && getGateway().available,
    queryFn: () => getGateway().chat(token ?? '', phone),
  });
}

export function useSendMessage(token: string | null, phone: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => getGateway().send(token ?? '', phone, text),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['messaging', 'chat'] }),
  });
}

export function useInstanceAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ token, action }: { token: string; action: 'reboot' | 'logout' | 'clearQueue' }) => {
      await getGateway()[action](token);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['messaging', 'status'] }),
  });
}
