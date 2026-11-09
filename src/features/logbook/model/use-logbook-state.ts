import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { readStorage, writeStorage } from '@/shared/lib/storage';
import type { FilterOption } from '../api/schemas';
import { fromApiDate, toApiDate } from './time';

export type Density = 'compact' | 'comfort';

/** px на час (design-system.md → «Плотность / зум расписания»). */
export const HOUR_HEIGHT: Record<Density, number> = { compact: 80, comfort: 112 };

const DENSITY_KEY = 'elevn.logbook.density';

/**
 * Состояние журнала в URL: ?date=2025-06-21&f=2:5003&busy=1 — ссылку можно переслать коллеге.
 * Плотность — личная настройка, в localStorage.
 */
export function useLogbookState(filters: FilterOption[] | undefined) {
  const [params, setParams] = useSearchParams();

  const date = fromApiDate(params.get('date') ?? '') ?? new Date();
  const [fType, fId] = (params.get('f') ?? '').split(':');
  const filter = filters?.find((f) => String(f.recType) === fType && String(f.recId) === fId) ?? filters?.[0] ?? null;
  const onlyBusy = params.get('busy') === '1';
  const [density, setDensityState] = useState<Density>(() =>
    readStorage<Density>(DENSITY_KEY) === 'comfort' ? 'comfort' : 'compact',
  );

  const patch = (changes: Record<string, string | null>) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(changes)) {
          if (value === null) next.delete(key);
          else next.set(key, value);
        }
        return next;
      },
      { replace: true },
    );
  };

  return {
    date,
    apiDate: toApiDate(date),
    filter,
    onlyBusy,
    density,
    setDate: (value: Date) => {
      patch({ date: toApiDate(value) });
    },
    setFilter: (value: FilterOption) => {
      patch({ f: `${value.recType}:${value.recId}` });
    },
    setOnlyBusy: (value: boolean) => {
      patch({ busy: value ? '1' : null });
    },
    setDensity: (value: Density) => {
      writeStorage(DENSITY_KEY, value);
      setDensityState(value);
    },
  };
}
