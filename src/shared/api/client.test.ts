import { http, HttpResponse } from 'msw';
import { z } from 'zod';
import { server } from '@/test/server';
import { env } from '@/shared/lib/env';
import { callApi } from './client';
import { ApiError } from './errors';

const rowSchema = z.object({ ID: z.coerce.number() });

describe('callApi', () => {
  it('отправляет MethodName и валидирует строки', async () => {
    let body: unknown;
    server.use(
      http.post(env.apiUrl, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ data: [{ ID: '7' }], result: 0, resultdescription: '' });
      }),
    );
    const rows = await callApi('TestMethod', { Foo: 1 }, { schema: rowSchema });
    expect(rows).toEqual([{ ID: 7 }]);
    expect(body).toMatchObject({ MethodName: 'TestMethod', Foo: 1 });
  });

  it('превращает result != 0 в ApiError с описанием', async () => {
    server.use(
      http.post(env.apiUrl, () => HttpResponse.json({ data: [], result: 5, resultdescription: 'Нет доступа' })),
    );
    await expect(callApi('TestMethod', {}, { schema: rowSchema })).rejects.toMatchObject({
      kind: 'server',
      code: 5,
      message: 'Нет доступа',
    });
  });

  it('видит бизнес-ошибку в RESULT строки при result: 0 в конверте', async () => {
    server.use(
      http.post(env.apiUrl, () =>
        HttpResponse.json({
          data: [{ ID: '', RESULT: '2', RESULTDESCRIPTION: 'Неправильный пароль' }],
          result: 0,
          resultdescription: 'OK',
        }),
      ),
    );
    await expect(callApi('TestMethod', {}, { schema: rowSchema })).rejects.toMatchObject({
      kind: 'server',
      code: 2,
      message: 'Неправильный пароль',
    });
  });

  it('заменяет символы, которые ломают бэкенд', async () => {
    let raw = '';
    server.use(
      http.post(env.apiUrl, async ({ request }) => {
        raw = await request.text();
        return HttpResponse.json({ data: [], result: 0 });
      }),
    );
    await callApi('TestMethod', { Name: "O'Brien", Price: '500 ₽' }, { schema: rowSchema });
    expect(raw).toContain('O`Brien');
    expect(raw).toContain('500 р');
  });

  it('падает на ответе, не прошедшем схему', async () => {
    server.use(http.post(env.apiUrl, () => HttpResponse.json({ data: [{ ID: 'abc' }], result: 0 })));
    await expect(callApi('TestMethod', {}, { schema: rowSchema })).rejects.toBeInstanceOf(ApiError);
  });
});
