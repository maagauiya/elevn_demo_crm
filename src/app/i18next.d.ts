import 'i18next';
import type auth from '@/features/auth/locales/ru.json';
import type billing from '@/features/billing/locales/ru.json';
import type dashboard from '@/features/dashboard/locales/ru.json';
import type dental from '@/features/dental/locales/ru.json';
import type handbook from '@/features/handbook/locales/ru.json';
import type kanban from '@/features/kanban/locales/ru.json';
import type logbook from '@/features/logbook/locales/ru.json';
import type multiselect from '@/features/multiselect/locales/ru.json';
import type navigation from '@/features/navigation/locales/ru.json';
import type notifications from '@/features/notifications/locales/ru.json';
import type workSchedule from '@/features/work-schedule/locales/ru.json';
import type common from '@/shared/i18n/locales/ru.json';

/** Типизированные ключи переводов: опечатка в t('...') — ошибка компиляции. Источник типов — ru.json. */
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof common;
      auth: typeof auth;
      logbook: typeof logbook;
      dashboard: typeof dashboard;
      'work-schedule': typeof workSchedule;
      notifications: typeof notifications;
      handbook: typeof handbook;
      kanban: typeof kanban;
      navigation: typeof navigation;
      multiselect: typeof multiselect;
      dental: typeof dental;
      billing: typeof billing;
    };
  }
}
