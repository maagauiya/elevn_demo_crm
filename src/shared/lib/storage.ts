/**
 * Безопасная обёртка над Web Storage: в приватном режиме или при запрете доступ кидает исключение.
 */
type StorageKind = 'local' | 'session';

function getStorage(kind: StorageKind): Storage | null {
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

// Осознанный каст: хранилище пишем сами. Для внешних данных — валидируй zod-схемой.
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export function readStorage<T>(key: string, kind: StorageKind = 'local'): T | null {
  try {
    const raw = getStorage(kind)?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: unknown, kind: StorageKind = 'local') {
  try {
    getStorage(kind)?.setItem(key, JSON.stringify(value));
  } catch {
    /* хранилище недоступно — молча работаем без него */
  }
}

export function removeStorage(key: string, kind: StorageKind = 'local') {
  try {
    getStorage(kind)?.removeItem(key);
  } catch {
    /* noop */
  }
}
