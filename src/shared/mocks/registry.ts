import { delay, http, HttpResponse } from 'msw';
import { env } from '@/shared/lib/env';

/** Тело запроса к единому эндпоинту. */
export type MockRequest = Record<string, unknown> & { MethodName?: string };

/** Значение параметра запроса строкой (бэкенд тоже получает всё строками). */
export function param(request: MockRequest, name: string): string {
  const value = request[name];
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

/** Хендлер одного метода: получает тело запроса, возвращает строки data. */
export type MockMethod = (request: MockRequest) => unknown[] | Promise<unknown[]>;

/** Каждая фича экспортирует свой набор из features/<name>/mocks/index.ts. */
export type MockMethods = Record<string, MockMethod>;

/** Бросай из хендлера, чтобы вернуть бизнес-ошибку (result != 0), как это делает бэкенд. */
export class MockError extends Error {
  readonly code: number;
  constructor(message: string, code = 1) {
    super(message);
    this.code = code;
  }
}

let latency: [number, number] = [150, 450];

/** Задержка ответа моков. В тестах — 0. */
export function setMockLatency(min: number, max = min) {
  latency = [min, max];
}

export function defineMocks(methods: MockMethods): MockMethods {
  return methods;
}

/** Собирает хендлеры фич в один MSW-хендлер, который диспатчит по MethodName. */
export function createApiHandler(...groups: MockMethods[]) {
  const methods: MockMethods = {};
  for (const group of groups) {
    for (const [name, handler] of Object.entries(group)) {
      if (name in methods) console.warn(`[mocks] метод ${name} зарегистрирован дважды`);
      methods[name] = handler;
    }
  }

  return http.post(env.apiUrl, async ({ request }) => {
    const body = (await request.json()) as MockRequest;
    const name = body.MethodName ?? '';
    const handler = methods[name];

    const [min, max] = latency;
    if (max > 0) await delay(min + Math.random() * (max - min));

    if (!handler) {
      console.error(`[mocks] нет мока для метода "${name}". Добавь его в features/<name>/mocks.`);
      return HttpResponse.json({ data: [], result: -1, resultdescription: `Mock not found: ${name}` });
    }
    try {
      const data = await handler(body);
      return HttpResponse.json({ data, result: 0, resultdescription: '' });
    } catch (error) {
      if (error instanceof MockError) {
        return HttpResponse.json({ data: [], result: error.code, resultdescription: error.message });
      }
      throw error;
    }
  });
}
