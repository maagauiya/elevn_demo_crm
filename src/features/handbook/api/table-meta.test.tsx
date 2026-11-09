import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { server } from '@/test/server';
import { env } from '@/shared/lib/env';
import { setApiContext } from '@/shared/api';
import { useItemData, useItemMeta, useItemParams } from './table-meta';

vi.mock('@/features/auth', () => ({
  useCurrentUser: () => ({
    userId: 1000004,
    role: 1,
    docId: 0,
    companyId: 1,
    name: 'Тест',
    position: '',
    photo: null,
    defaultNavItemId: null,
  }),
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  setApiContext({ apiKey: 'test', sessionId: 'sess', langId: '0' });
});

describe('useItemMeta', () => {
  it('фильтрует невидимые колонки и сортирует по FORDERNUMBER', async () => {
    server.use(
      http.post(env.apiUrl, () =>
        HttpResponse.json({
          data: [
            {
              FID: '2',
              FNAME: 'NAME',
              FCAPTION: 'Название',
              FISVISBLE: '1',
              FTYPEID: '4',
              FORDERNUMBER: '1',
              FILTERTYPEID: '1',
              GROUPINGLVL: '',
              SUMMARYTYPE: '',
            },
            {
              FID: '1',
              FNAME: 'ID',
              FCAPTION: 'id',
              FISVISBLE: '0',
              FTYPEID: '1',
              FORDERNUMBER: '0',
              FILTERTYPEID: '0',
              GROUPINGLVL: '',
              SUMMARYTYPE: '',
            },
          ],
          result: 0,
          resultdescription: 'OK',
        }),
      ),
    );
    const { result } = renderHook(() => useItemMeta(65), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([
      {
        id: 2,
        name: 'NAME',
        caption: 'Название',
        visible: true,
        typeId: '4',
        order: 1,
        filterTypeId: '1',
        groupingLevel: null,
        summaryType: null,
      },
    ]);
  });
});

describe('useItemParams', () => {
  it('пустой список параметров — раздел без диалога', async () => {
    server.use(http.post(env.apiUrl, () => HttpResponse.json({ data: [], result: 0, resultdescription: 'OK' })));
    const { result } = renderHook(() => useItemParams(65), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('разбирает поля параметров', async () => {
    server.use(
      http.post(env.apiUrl, () =>
        HttpResponse.json({
          data: [
            {
              DBFIELDNAME: 'F_Name',
              CAPTION: 'Поиск',
              FIELDTYPEID: '4',
              STRINGMAXLEN: '127',
              NUMSIZE: '0',
              ROTPOINT: '0',
              DICTNAME: '',
              DICTTYPE: '',
              WUSERID: '',
              DEFAULTVALUE: '',
            },
          ],
          result: 0,
          resultdescription: 'OK',
        }),
      ),
    );
    const { result } = renderHook(() => useItemParams(4), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([
      {
        name: 'F_NAME',
        caption: 'Поиск',
        typeId: '4',
        maxLength: 127,
        dictName: null,
        dictType: null,
        wUserId: null,
        defaultValue: null,
      },
    ]);
  });
});

describe('useItemData', () => {
  it('не делает запрос, пока paramValues === null', () => {
    server.use(http.post(env.apiUrl, () => HttpResponse.json({ data: [], result: 0 })));
    const { result } = renderHook(() => useItemData(65, 'WAGetCompanyList', null), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('передаёт UserId и параметры в метод раздела', async () => {
    let body: unknown;
    server.use(
      http.post(env.apiUrl, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ data: [{ ID: '1', NAME: 'Филиал' }], result: 0, resultdescription: 'OK' });
      }),
    );
    const { result } = renderHook(() => useItemData(65, 'WAGetCompanyList', {}), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ ID: '1', NAME: 'Филиал' }]);
    expect(body).toMatchObject({ MethodName: 'WAGetCompanyList', UserId: 1000004 });
  });
});
