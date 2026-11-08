import { defineMocks } from '@/shared/mocks';
import nav from './fixtures/nav.json';

/**
 * Меню — снимок реального WAGetNav с локального бэкенда (pnpm metadata:sync).
 * Руками не правим: перегенерируй фикстуру, если меню в базе поменялось.
 */
export const navigationMocks = defineMocks({
  WAGetNav: ({ LangId }) => (LangId === '1' ? nav.en : nav.ru),
});
