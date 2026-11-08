import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { setApiContext } from '@/shared/api';
import { readStorage, writeStorage } from '@/shared/lib/storage';
import en from './locales/en.json';
import ru from './locales/ru.json';

export const LANGUAGES = ['ru', 'en'] as const;
export type Language = (typeof LANGUAGES)[number];

const STORAGE_KEY = 'elevn.lang';
const LANG_ID: Record<Language, string> = { ru: '0', en: '1' };

const isLanguage = (value: unknown): value is Language => LANGUAGES.includes(value as Language);

const stored = readStorage<string>(STORAGE_KEY);
const initial: Language = isLanguage(stored) ? stored : 'ru';

void i18n.use(initReactI18next).init({
  lng: initial,
  fallbackLng: 'ru',
  defaultNS: 'common',
  ns: ['common'],
  resources: { ru: { common: ru }, en: { common: en } },
  interpolation: { escapeValue: false },
});

setApiContext({ langId: LANG_ID[initial] });
document.documentElement.lang = initial;

i18n.on('languageChanged', (lng) => {
  if (!isLanguage(lng)) return;
  writeStorage(STORAGE_KEY, lng);
  setApiContext({ langId: LANG_ID[lng] });
  document.documentElement.lang = lng;
});

/**
 * Регистрирует неймспейс фичи. Вызывается в features/<name>/i18n.ts — файл импортируется
 * из lazy-страниц, так что переводы грузятся вместе с кодом фичи.
 */
export function registerTranslations<const N extends string>(ns: N, resources: Record<Language, object>): N {
  for (const lng of LANGUAGES) {
    if (!i18n.hasResourceBundle(lng, ns)) i18n.addResourceBundle(lng, ns, resources[lng], true, true);
  }
  return ns;
}

export { i18n };
