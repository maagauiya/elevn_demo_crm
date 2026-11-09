import { useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { useCurrentUser } from '@/features/auth';
import { apiField, callApi } from '@/shared/api';
import { normalizeAtsPhone, serverDateTime } from '../model/phone';
import type { CallEvent } from '../model/types';

/** «НЕТ» и пустые строки процедура отдаёт вместо отсутствующих значений. */
const text = z
  .string()
  .nullish()
  .transform((v) => {
    const t = v?.trim() ?? '';
    return t && t.toUpperCase() !== 'НЕТ' ? t : null;
  });

/** WAATSOnIncomingCall: всплывающая карточка клиента по номеру. */
const cardSchema = z
  .object({
    CLIENTID: apiField.optionalString,
    CLIENTNAME: text,
    CLIENTPHONE: text,
    BONUSAMOUNT: text,
    LASTVISITDATE: text,
    LASTVISITDOCTOR: text,
    LASTMANIPULATION: text,
    NEXTVISITDATE: text,
    NEXTVISITDOCTOR: text,
    NEXTMANIPULATION: text,
    BELOVEDDOCTOR: text,
    CLCOMMENT: text,
  })
  .transform((r) => ({
    clientId: r.CLIENTID && r.CLIENTID !== '0' ? Number(r.CLIENTID) : null,
    name: r.CLIENTNAME,
    phone: r.CLIENTPHONE,
    bonus: r.BONUSAMOUNT,
    lastVisit: [r.LASTVISITDATE, r.LASTVISITDOCTOR, r.LASTMANIPULATION].filter(Boolean).join(' · ') || null,
    nextVisit: [r.NEXTVISITDATE, r.NEXTVISITDOCTOR, r.NEXTMANIPULATION].filter(Boolean).join(' · ') || null,
    beloved: r.BELOVEDDOCTOR?.split(',').slice(0, 3).join(', ') ?? null,
    comment: r.CLCOMMENT,
  }));

export type CallerCard = z.output<typeof cardSchema>;

export function useCallerCard(phone: string) {
  const user = useCurrentUser();
  const cellphone = normalizeAtsPhone(phone);
  return useQuery({
    queryKey: ['telephony', 'card', cellphone],
    staleTime: 5 * 60_000,
    queryFn: async ({ signal }) => {
      const [card] = await callApi(
        'WAATSOnIncomingCall',
        { UserId: user.userId, Cellphone: cellphone },
        { schema: cardSchema, signal },
      );
      return card ?? null;
    },
  });
}

const resultSchema = z
  .object({ RESULTDESCRIPTION: z.string().nullish() })
  .transform((r) => r.RESULTDESCRIPTION?.trim() ?? '');

/** Фиксация завершённого звонка (WAATSOnCallEnd). StateId: 1 — состоялся, 2 — пропущен. */
export function useSaveCall() {
  const user = useCurrentUser();
  return useMutation({
    mutationFn: async ({
      event,
      missed,
      clientPhone,
    }: {
      event: CallEvent;
      missed: boolean;
      clientPhone: string | null;
    }) => {
      const now = Math.floor(Date.now() / 1000);
      await callApi(
        'WAATSOnCallEnd',
        {
          UserId: user.userId,
          ExtCallId: event.callId,
          Clientnumber: clientPhone ?? normalizeAtsPhone(event.phone),
          Incoming: event.direction === 'in' ? 1 : 0,
          StateId: missed ? 2 : 1,
          RecordURL: event.record ?? '',
          CallStart: serverDateTime(event.start ?? now),
          CallFinish: serverDateTime(event.end ?? now),
          Duration: event.duration ?? 0,
        },
        { schema: resultSchema, retry: false },
      );
    },
  });
}

export function useSetExtension() {
  const user = useCurrentUser();
  return useMutation({
    mutationFn: async (extension: string) => {
      const [message] = await callApi(
        'WAATSSetIntNumber',
        { UserId: user.userId, IntNumber: extension },
        { schema: resultSchema, retry: false },
      );
      return message ?? '';
    },
  });
}
