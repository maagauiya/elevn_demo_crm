import type { AtsClient, AtsStatus, CallEvent } from './types';

/** Поля события библиотеки «Простые звонки» (см. vendor/prostiezvonki.js). */
interface PzEvent {
  callID: string;
  type: string;
  from: string;
  to?: string;
  direction?: string;
  start?: string;
  end?: string;
  duration?: string;
  record?: string;
  isIncoming: () => boolean;
  isOutcoming: () => boolean;
  isIncomingAnswer: () => boolean;
  isOutcomingAnswer: () => boolean;
  isHistory: () => boolean;
}

interface Pz {
  connect: (opts: { host: string; client_id: string; client_type: string; user_phone: string }) => void;
  disconnect: () => void;
  call: (phone: string) => void;
  onConnect: (cb: () => void) => void;
  onDisconnect: (cb: (e: { code: number }) => void) => void;
  onEvent: (cb: (e: PzEvent) => void) => void;
  APPLICATION_ERRORS?: Record<number, { ru: string; en: string } | undefined>;
}

declare global {
  interface Window {
    pz?: Pz;
  }
}

/** Проверка связи в «Простых звонках» — служебный номер, не показываем. */
const PING_NUMBER = '+79990000000';
const CLIENT_TYPE = 'jsapi';

function toCallEvent(e: PzEvent): CallEvent | null {
  if (e.from === PING_NUMBER) return null;
  const direction = e.direction === '1' ? 'out' : 'in';
  const phone = direction === 'in' ? e.from : (e.to ?? '');
  const base = { callId: e.callID, direction, phone } as const;
  if (e.isIncoming()) return { ...base, kind: 'incoming', direction: 'in', phone: e.from };
  if (e.isOutcoming()) return { ...base, kind: 'outgoing', direction: 'out', phone: e.to ?? '' };
  if (e.isIncomingAnswer() || e.isOutcomingAnswer()) return { ...base, kind: 'answered' };
  if (e.isHistory()) {
    return {
      ...base,
      kind: 'ended',
      ...(e.start ? { start: Number(e.start) } : {}),
      ...(e.end ? { end: Number(e.end) } : {}),
      ...(e.duration ? { duration: Number(e.duration) } : {}),
      ...(e.record ? { record: e.record } : {}),
    };
  }
  return null;
}

/** Клиент АТС поверх «Простых звонков». Библиотека грузится лениво — только у пользователей с телефонией. */
export async function createPzClient(config: {
  server: string;
  password: string;
  extension: string;
  lang: string;
}): Promise<AtsClient> {
  await import('../vendor/prostiezvonki.js');
  const pz = window.pz;
  if (!pz) throw new Error('Библиотека «Простые звонки» не загрузилась');
  let statusCb: (status: AtsStatus, reason?: string) => void = () => undefined;
  return {
    connect: () => {
      statusCb('connecting');
      pz.onConnect(() => {
        statusCb('connected');
      });
      pz.onDisconnect((e) => {
        const reason = pz.APPLICATION_ERRORS?.[e.code]?.[config.lang === 'en' ? 'en' : 'ru'];
        statusCb('disconnected', reason);
      });
      pz.connect({
        host: config.server,
        client_id: config.password,
        client_type: CLIENT_TYPE,
        user_phone: config.extension,
      });
    },
    disconnect: () => {
      pz.disconnect();
    },
    call: (phone) => {
      pz.call(phone);
    },
    onEvent: (cb) => {
      pz.onEvent((e) => {
        const event = toCallEvent(e);
        if (event) cb(event);
      });
    },
    onStatus: (cb) => {
      statusCb = cb;
    },
  };
}
