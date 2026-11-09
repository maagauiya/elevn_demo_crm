import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { server } from '@/test/server';
import { env } from '@/shared/lib/env';
import { setApiContext } from '@/shared/api';
import { chunkParamValues, useEditorData, useEditorFields } from './table-editor';

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

describe('chunkParamValues', () => {
  it('упаковывает поля в ParamValue/ParamValue2… по "ИМЯ;;;ЗНАЧЕНИЕ"', () => {
    expect(chunkParamValues({ NAME: 'Интернет', PHONE: '77001234567' })).toEqual([
      { ParamValue: 'NAME;;;Интернет', ParamValue2: 'PHONE;;;77001234567' },
    ]);
  });

  it('пустой набор полей — пустой список чанков', () => {
    expect(chunkParamValues({})).toEqual([]);
  });

  it('больше 10 полей — несколько чанков', () => {
    const fields = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`F${i}`, String(i)]));
    const chunks = chunkParamValues(fields);
    expect(chunks).toHaveLength(2);
    expect(Object.keys(chunks[0] ?? {})).toHaveLength(10);
    expect(Object.keys(chunks[1] ?? {})).toHaveLength(2);
  });
});

describe('useEditorFields', () => {
  it('разбирает поля и сортирует по ORDERNUMBER', async () => {
    server.use(
      http.post(env.apiUrl, () =>
        HttpResponse.json({
          data: [
            {
              DBFIELDNAME: 'NAME',
              CAPTION: 'Источник рекламы',
              ISREADONLY: '0',
              ORDERNUMBER: '1',
              ISBOOL: '0',
              ISPASSWORD: '0',
              MULTITEXT: '0',
              ISPHONE: '0',
              FIELDTYPEID: '4',
              STRINGMAXLEN: '127',
              FKTABLE: '',
              FKFIELD: '',
              EPANECAPTION: 'Основные',
            },
          ],
          result: 0,
          resultdescription: 'OK',
        }),
      ),
    );
    const { result } = renderHook(() => useEditorFields('REKLAMA'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([
      {
        name: 'NAME',
        caption: 'Источник рекламы',
        readOnly: false,
        order: 1,
        isBool: false,
        isPassword: false,
        multiline: false,
        isPhone: false,
        dictName: null,
        dictType: null,
        wUserId: null,
        typeId: '4',
        maxLength: 127,
        paneCaption: 'Основные',
      },
    ]);
  });

  it('не делает запрос без editorTable', () => {
    server.use(http.post(env.apiUrl, () => HttpResponse.json({ data: [], result: 0 })));
    const { result } = renderHook(() => useEditorFields(undefined), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useEditorData', () => {
  it('пустой id — не делает запрос (режим создания)', () => {
    server.use(http.post(env.apiUrl, () => HttpResponse.json({ data: [], result: 0 })));
    const { result } = renderHook(() => useEditorData('REKLAMA', undefined), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('разбирает значения существующей записи', async () => {
    server.use(
      http.post(env.apiUrl, () =>
        HttpResponse.json({
          data: [{ DBFIELDNAME: 'NAME', FIELDVALUE: 'Интернет', FIELDFKVALUE: '' }],
          result: 0,
          resultdescription: 'OK',
        }),
      ),
    );
    const { result } = renderHook(() => useEditorData('REKLAMA', '3'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ name: 'NAME', value: 'Интернет', fkValue: null }]);
  });
});
