import { create } from 'zustand';
import type { AtsClient, AtsStatus } from './types';

/** Активные звонки и статус подключения к АТС. */
export interface ActiveCall {
  callId: string;
  direction: 'in' | 'out';
  phone: string;
  state: 'ringing' | 'talking' | 'ended' | 'missed';
}

interface TelephonyState {
  status: AtsStatus;
  client: AtsClient | null;
  calls: ActiveCall[];
  setStatus: (status: AtsStatus) => void;
  setClient: (client: AtsClient | null) => void;
  upsertCall: (call: ActiveCall) => void;
  dismiss: (callId: string) => void;
}

export const useTelephony = create<TelephonyState>()((set) => ({
  status: 'off',
  client: null,
  calls: [],
  setStatus: (status) => {
    set({ status });
  },
  setClient: (client) => {
    set({ client });
  },
  upsertCall: (call) => {
    set((s) => ({ calls: [...s.calls.filter((c) => c.callId !== call.callId), call] }));
  },
  dismiss: (callId) => {
    set((s) => ({ calls: s.calls.filter((c) => c.callId !== callId) }));
  },
}));
