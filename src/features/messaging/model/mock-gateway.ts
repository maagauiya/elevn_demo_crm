import type { ChatMessage, InstanceState, WhatsAppGateway } from './gateway';

/** Синтетический шлюз для режима моков: состояние, QR-заглушка, переписка в памяти. */
export function mockGateway(): WhatsAppGateway {
  let state: InstanceState = 'notAuthorized';
  let queue = 3;
  const chats = new Map<string, ChatMessage[]>();
  const now = () => Math.floor(Date.now() / 1000);
  // Заглушка вместо QR: шахматный узор в SVG (настоящий QR отдаёт Green API).
  const cells = Array.from({ length: 21 * 21 }, (_, i) =>
    (i * 7919) % 3 === 0 ? `<rect x="${i % 21}" y="${Math.floor(i / 21)}" width="1" height="1"/>` : '',
  ).join('');
  const qrImage = `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21" shape-rendering="crispEdges"><rect width="21" height="21" fill="#fff"/><g fill="#1d1d1f">${cells}</g></svg>`)}`;
  return {
    available: true,
    state: () => Promise.resolve(state),
    queueSize: () => Promise.resolve(queue),
    qr: () => {
      if (state === 'authorized') return Promise.resolve({ kind: 'logged' });
      state = 'authorized';
      return Promise.resolve({ kind: 'qr', image: qrImage });
    },
    reboot: () => Promise.resolve(),
    logout: () => {
      state = 'notAuthorized';
      return Promise.resolve();
    },
    clearQueue: () => {
      queue = 0;
      return Promise.resolve();
    },
    chat: (_token, phone) =>
      Promise.resolve(
        chats.get(phone) ?? [
          { fromMe: true, text: 'Здравствуйте! Напоминаем о записи завтра в 12:00.', timestamp: now() - 86_400 },
          { fromMe: false, text: 'Спасибо, буду.', timestamp: now() - 86_000 },
        ],
      ),
    send: (_token, phone, text) => {
      const list = chats.get(phone) ?? [];
      chats.set(phone, [...list, { fromMe: true, text, timestamp: now() }]);
      return Promise.resolve();
    },
  };
}
