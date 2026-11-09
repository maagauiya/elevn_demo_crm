import type { AtsClient, AtsStatus, CallEvent } from './types';

declare global {
  interface Window {
    /** Только в dev/моках: управление симулятором звонков (e2e, /dev/kit). */
    __elevnAts?: {
      incoming: (phone: string) => string;
      answer: (callId?: string) => void;
      hangup: (callId?: string) => void;
    };
  }
}

/**
 * Симулятор АТС для разработки и e2e: телефонии локально нет. Включается в режиме моков
 * или VITE_ATS_SIMULATOR=true. Генерирует те же события, что и «Простые звонки».
 */
export function createSimulator(): AtsClient {
  let eventCb: (e: CallEvent) => void = () => undefined;
  let statusCb: (s: AtsStatus) => void = () => undefined;
  const calls = new Map<string, { phone: string; direction: 'in' | 'out'; start: number; answered: boolean }>();
  let seq = 1;
  const now = () => Math.floor(Date.now() / 1000);
  const last = () => [...calls.keys()].at(-1);

  const start = (phone: string, direction: 'in' | 'out') => {
    const callId = `sim-${seq++}`;
    calls.set(callId, { phone, direction, start: now(), answered: false });
    eventCb({ callId, kind: direction === 'in' ? 'incoming' : 'outgoing', direction, phone });
    return callId;
  };

  const api = {
    incoming: (phone: string) => start(phone, 'in'),
    answer: (callId = last()) => {
      const call = callId ? calls.get(callId) : undefined;
      if (!call || !callId) return;
      call.answered = true;
      eventCb({ callId, kind: 'answered', direction: call.direction, phone: call.phone });
    },
    hangup: (callId = last()) => {
      const call = callId ? calls.get(callId) : undefined;
      if (!call || !callId) return;
      calls.delete(callId);
      const end = now();
      eventCb({
        callId,
        kind: 'ended',
        direction: call.direction,
        phone: call.phone,
        start: call.start,
        end,
        duration: call.answered ? end - call.start : 0,
      });
    },
  };

  return {
    connect: () => {
      window.__elevnAts = api;
      statusCb('connected');
    },
    disconnect: () => {
      delete window.__elevnAts;
      statusCb('off');
    },
    call: (phone) => {
      start(phone, 'out');
    },
    onEvent: (cb) => {
      eventCb = cb;
    },
    onStatus: (cb) => {
      statusCb = cb;
    },
  };
}
