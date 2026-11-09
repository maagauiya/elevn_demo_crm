import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { useItemParams } from '../api/params-api';

const PREFIX = 'p.';

export type ParamValues = Record<string, string>;

/**
 * Значения входных параметров живут в URL (?p.COMPANYID=1&p.YEARID=2025): ссылку можно переслать,
 * перезагрузка страницы их не теряет. Пустое значение — берём DEFAULTVALUE из базы.
 * Для справочников без значения форма сама подставит первый вариант (см. ItemParamsBar).
 */
export function useItemParamsState(itemId: number | undefined) {
  const fields = useItemParams(itemId);
  const [searchParams, setSearchParams] = useSearchParams();

  const values = useMemo<ParamValues>(() => {
    const result: ParamValues = {};
    for (const field of fields.data ?? []) {
      result[field.name] = searchParams.get(PREFIX + field.name) ?? field.defaultValue ?? '';
    }
    return result;
  }, [fields.data, searchParams]);

  const setValue = (name: string, value: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set(PREFIX + name, value);
        return next;
      },
      { replace: true },
    );
  };

  // Готово, когда описание полей загружено и у справочников есть значение.
  const ready = fields.isSuccess && fields.data.every((field) => field.type !== 10 || values[field.name] !== '');

  return { fields, values, setValue, ready };
}

export type ItemParamsState = ReturnType<typeof useItemParamsState>;
