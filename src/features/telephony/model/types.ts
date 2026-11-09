/** Событие звонка в понятном виде (вместо XML-кодов «Простых звонков»). */
export interface CallEvent {
  callId: string;
  kind: 'incoming' | 'outgoing' | 'answered' | 'ended';
  direction: 'in' | 'out';
  /** Номер собеседника, как пришёл от АТС */
  phone: string;
  start?: number;
  end?: number;
  duration?: number;
  record?: string;
}

export type AtsStatus = 'off' | 'connecting' | 'connected' | 'disconnected';

export interface AtsClient {
  connect: () => void;
  disconnect: () => void;
  call: (phone: string) => void;
  onEvent: (cb: (e: CallEvent) => void) => void;
  onStatus: (cb: (status: AtsStatus, reason?: string) => void) => void;
}
