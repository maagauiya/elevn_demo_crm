/**
 * Шлюз WhatsApp. Старый фронт ходил прямо из браузера в Green API (api.green-api.com) с токеном инстанса
 * из WAGetMSGInstanceList и в отдельный прокси для чата. Токены в браузере — утечка, поэтому:
 *  - по умолчанию шлюз выключен (UnavailableGateway) — нужен прокси на бэкенде (backend-requests.md);
 *  - в режиме моков — синтетический шлюз;
 *  - VITE_WHATSAPP_DIRECT=true — прямой Green API, как в старом фронте (осознанно, на свой риск).
 */
export type InstanceState =
  'authorized' | 'notAuthorized' | 'sleepMode' | 'starting' | 'yellowCard' | 'blocked' | 'unknown';

export interface ChatMessage {
  fromMe: boolean;
  text: string;
  /** unix-секунды */
  timestamp: number;
}

export interface WhatsAppGateway {
  available: boolean;
  state: (token: string) => Promise<InstanceState>;
  queueSize: (token: string) => Promise<number>;
  qr: (
    token: string,
  ) => Promise<{ kind: 'qr'; image: string } | { kind: 'logged' } | { kind: 'error'; message: string }>;
  reboot: (token: string) => Promise<void>;
  logout: (token: string) => Promise<void>;
  clearQueue: (token: string) => Promise<void>;
  chat: (token: string, phone: string) => Promise<ChatMessage[]>;
  send: (token: string, phone: string, text: string) => Promise<void>;
}

export class GatewayUnavailableError extends Error {
  constructor() {
    super('WhatsApp gateway is not configured');
    this.name = 'GatewayUnavailableError';
  }
}

const unavailable = (): Promise<never> => Promise.reject(new GatewayUnavailableError());

export const unavailableGateway: WhatsAppGateway = {
  available: false,
  state: unavailable,
  queueSize: unavailable,
  qr: unavailable,
  reboot: unavailable,
  logout: unavailable,
  clearQueue: unavailable,
  chat: unavailable,
  send: unavailable,
};

/** Прямой Green API (паритет со старым фронтом). Токен — "idInstance.apiToken". */
export function greenApiGateway(baseUrl: string): WhatsAppGateway {
  const split = (token: string) => {
    const [id = '', key = ''] = token.split('.');
    return { id, key };
  };
  const get = async <T>(token: string, action: string): Promise<T> => {
    const { id, key } = split(token);
    const res = await fetch(`${baseUrl}/waInstance${id}/${action}/${key}`);
    if (!res.ok) throw new Error(`Green API ${action}: HTTP ${res.status}`);
    return (await res.json()) as T;
  };
  const post = async <T>(token: string, action: string, body: unknown): Promise<T> => {
    const { id, key } = split(token);
    const res = await fetch(`${baseUrl}/waInstance${id}/${action}/${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Green API ${action}: HTTP ${res.status}`);
    return (await res.json()) as T;
  };
  const chatId = (phone: string) => `${phone.replace(/\D/g, '').replace(/^(\d{10})$/, '7$1')}@c.us`;
  return {
    available: true,
    state: async (token) =>
      (await get<{ stateInstance?: InstanceState }>(token, 'getStateInstance')).stateInstance ?? 'unknown',
    queueSize: async (token) => Number((await get<{ count?: string | number }>(token, 'getMessagesCount')).count ?? 0),
    qr: async (token) => {
      const data = await get<{ type: 'qrCode' | 'error' | 'alreadyLogged'; message: string }>(token, 'qr');
      if (data.type === 'qrCode') return { kind: 'qr', image: `data:image/png;base64,${data.message}` };
      if (data.type === 'alreadyLogged') return { kind: 'logged' };
      return { kind: 'error', message: data.message };
    },
    reboot: async (token) => {
      await get(token, 'reboot');
    },
    logout: async (token) => {
      await get(token, 'logout');
    },
    clearQueue: async (token) => {
      await get(token, 'clearMessagesQueue');
    },
    chat: async (token, phone) => {
      const rows = await post<{ type: string; textMessage?: string; timestamp: number }[]>(token, 'getChatHistory', {
        chatId: chatId(phone),
        count: 50,
      });
      return rows
        .filter((r) => r.textMessage)
        .map((r) => ({ fromMe: r.type === 'outgoing', text: r.textMessage ?? '', timestamp: r.timestamp }))
        .reverse();
    },
    send: async (token, phone, text) => {
      await post(token, 'sendMessage', { chatId: chatId(phone), message: text });
    },
  };
}
