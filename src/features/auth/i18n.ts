import { registerTranslations } from '@/shared/i18n';
import en from './locales/en.json';
import ru from './locales/ru.json';

export const AUTH_NS = registerTranslations('auth', { ru, en });
