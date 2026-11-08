/**
 * Контекст запросов: ключ компании, сессия, язык. Заполняет features/auth после логина,
 * shared/api только читает. Так shared не зависит от фич.
 */
export interface ApiContext {
  apiKey: string | null;
  sessionId: string | null;
  /** LangId для бэкенда: '0' — ru, '1' — en (как в старом фронте). */
  langId: string;
}

let context: ApiContext = { apiKey: null, sessionId: null, langId: '0' };

export function getApiContext(): ApiContext {
  return context;
}

export function setApiContext(patch: Partial<ApiContext>) {
  context = { ...context, ...patch };
}
