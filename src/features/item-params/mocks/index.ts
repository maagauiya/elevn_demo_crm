import { defineMocks, param } from '@/shared/mocks';
import fixture from './fixtures/params.json';

const params = fixture.params as Record<string, unknown[] | undefined>;
const dicts = fixture.dicts as Record<string, unknown[] | undefined>;

/** Описание полей и справочники — снимок с локального бэкенда (pnpm metadata:sync). */
export const itemParamsMocks = defineMocks({
  WAGetItemParams: (req) => params[param(req, 'WAItemId')] ?? [],
  WAGetItemParamDict: (req) =>
    dicts[`${param(req, 'DictName')}|${param(req, 'DictType') || '0'}|${param(req, 'WUserId') || '0'}`] ?? [],
});
