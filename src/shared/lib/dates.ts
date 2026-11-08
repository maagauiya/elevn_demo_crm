import { format, type Locale } from 'date-fns';
import { enUS, ru } from 'date-fns/locale';

const locales: Record<string, Locale> = { ru, en: enUS };

export function dateLocale(lang: string): Locale {
  return locales[lang] ?? ru;
}

export function formatDate(date: Date, pattern: string, lang = 'ru'): string {
  return format(date, pattern, { locale: dateLocale(lang) });
}
