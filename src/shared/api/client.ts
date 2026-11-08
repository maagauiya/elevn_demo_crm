import { z } from 'zod';
import { env } from '@/shared/lib/env';
import { getApiContext } from './context';
import { ApiError } from './errors';
import { createLimiter } from './limiter';

/** Формат ответа единого эндпоинта (тот же, что у старого API). */
const envelopeSchema = z.object({
  data: z.array(z.unknown()).nullish(),
  result: z.coerce.number(),
  resultdescription: z.string().nullish(),
});

const MAX_PARALLEL = 6;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

const limit = createLimiter(MAX_PARALLEL);

/**
 * Символы, которые бэкенд не переваривает (PHP вклеивает параметры прямо в SQL, база в cp1251).
 * Перенесено из старого фронта (replaceInvalidSymbols). ЭТО НЕ ЗАЩИТА от SQL-инъекций — только чтобы
 * «O'Brien» или «500 ₽» не роняли запрос. См. docs/CONTRIBUTING.md → «Локальный бэкенд».
 */
const BACKEND_UNSAFE: [RegExp, string][] = [
  [/'/g, '`'],
  [/₽/g, 'р'],
  [/꞉/g, ':'],
];

export function toBackendSafe(json: string): string {
  return BACKEND_UNSAFE.reduce((acc, [pattern, replacement]) => acc.replace(pattern, replacement), json);
}

/** Строка ответа с полями RESULT/RESULTDESCRIPTION — так процедуры сообщают о бизнес-ошибке. */
const rowResultSchema = z.object({ RESULT: z.coerce.number(), RESULTDESCRIPTION: z.string().nullish() });

export interface CallOptions<T> {
  /** zod-схема одной строки ответа. Ответ, не прошедший схему, — ошибка, а не тихий undefined. */
  schema: z.ZodType<T>;
  signal?: AbortSignal;
  /** Повторять ли запрос при 503. По умолчанию — да. */
  retry?: boolean;
  /**
   * Проверять RESULT в первой строке ответа. Процедуры часто возвращают ошибку так:
   * конверт { result: 0 }, а в строке RESULT: "2", RESULTDESCRIPTION: "Неправильный пароль".
   * Отключай, только если у метода RESULT — обычная колонка данных.
   */
  checkRowResult?: boolean;
}

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason as Error);
    });
  });

/**
 * Вызов метода бэкенда: POST { MethodName, ApiKey, SessionUUID, LangId, ...params }.
 * Возвращает массив строк data, провалидированных схемой.
 */
export async function callApi<T>(
  method: string,
  params: Record<string, unknown>,
  { schema, signal, retry = true, checkRowResult = true }: CallOptions<T>,
): Promise<T[]> {
  const { apiKey, sessionId, langId } = getApiContext();
  const body = toBackendSafe(
    JSON.stringify({
      ...params,
      MethodName: method,
      ...(apiKey ? { ApiKey: apiKey } : {}),
      ...(sessionId ? { SessionUUID: sessionId } : {}),
      LangId: langId,
    }),
  );

  const response = await limit(async () => {
    for (let attempt = 0; ; attempt += 1) {
      let res: Response;
      try {
        res = await fetch(env.apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          signal: signal ?? null,
        });
      } catch (error) {
        if (signal?.aborted) throw new ApiError(method, 'aborted', 'Запрос отменён', null, { cause: error });
        // Бэкенд рвёт соединение и на неизвестный метод — в dev подсказываем, куда смотреть.
        throw new ApiError(method, 'network', 'Нет соединения с сервером (или метода нет в API_METHODS)', null, {
          cause: error,
        });
      }
      if (res.status === 503 && retry && attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS, signal);
        continue;
      }
      return res;
    }
  });

  if (!response.ok) {
    throw new ApiError(method, 'http', `HTTP ${response.status}`, response.status);
  }

  const envelope = envelopeSchema.safeParse(await response.json());
  if (!envelope.success) {
    throw new ApiError(method, 'schema', 'Неожиданный формат ответа', null, { cause: envelope.error });
  }
  const { data, result, resultdescription } = envelope.data;
  if (result !== 0) {
    throw new ApiError(method, 'server', resultdescription ?? 'Ошибка сервера', result);
  }

  if (checkRowResult) {
    const rowResult = rowResultSchema.safeParse(data?.[0]);
    if (rowResult.success && rowResult.data.RESULT !== 0) {
      throw new ApiError(method, 'server', rowResult.data.RESULTDESCRIPTION ?? 'Ошибка сервера', rowResult.data.RESULT);
    }
  }

  const rows = z.array(schema).safeParse(data ?? []);
  if (!rows.success) {
    if (env.isDev) console.error(`[api] ${method}: ответ не прошёл схему`, rows.error.issues);
    throw new ApiError(method, 'schema', 'Ответ не соответствует схеме', null, { cause: rows.error });
  }
  return rows.data;
}

/** Вспомогательные схемы для полей старого API: всё приходит строками. */
export const apiField = {
  /** "123" → 123 */
  int: z.coerce.number().int(),
  /** "1" / "0" / "" → boolean */
  bool: z.union([z.string(), z.number(), z.boolean()]).transform((v) => v === true || v === '1' || v === 1),
  /** "" → null */
  optionalString: z
    .string()
    .nullish()
    .transform((v) => (v === '' ? null : (v ?? null))),
};
