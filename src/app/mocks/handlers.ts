import { authMocks } from '@/features/auth/mocks';
import { billingMocks } from '@/features/billing/mocks';
import { dashboardMocks } from '@/features/dashboard/mocks';
import { dentalMocks } from '@/features/dental/mocks';
import { handbookMocks } from '@/features/handbook/mocks';
import { itemParamsMocks } from '@/features/item-params/mocks';
import { kanbanMocks } from '@/features/kanban/mocks';
import { logbookMocks } from '@/features/logbook/mocks';
import { multiselectMocks } from '@/features/multiselect/mocks';
import { navigationMocks } from '@/features/navigation/mocks';
import { messagingMocks } from '@/features/messaging/mocks';
import { notificationsMocks } from '@/features/notifications/mocks';
import { telephonyMocks } from '@/features/telephony/mocks';
import { workScheduleMocks } from '@/features/work-schedule/mocks';
import { createApiHandler, defineMocks, firstNonEmpty, type MockMethods, omitMocks } from '@/shared/mocks';

/**
 * Методы, нужные обоим трекам. Параметры экранов: снимок item-params (дашборды, графики, спец-экраны)
 * дополняется снимком handbook (разделы-таблицы).
 */
const SHARED = ['WAGetItemParams', 'WAGetItemParamDict'] as const;
const sharedMocks = defineMocks({
  WAGetItemParams: firstNonEmpty(itemParamsMocks.WAGetItemParams, handbookMocks.WAGetItemParams),
  WAGetItemParamDict: firstNonEmpty(itemParamsMocks.WAGetItemParamDict, handbookMocks.WAGetItemParamDict),
});

/**
 * Все наборы моков. Новая фича → одна строка здесь. Один метод — один владелец
 * (проверяет handlers.test.ts); общие методы — в sharedMocks.
 */
export const mockGroups: MockMethods[] = [
  authMocks,
  navigationMocks,
  sharedMocks,
  omitMocks(itemParamsMocks, SHARED),
  // Трек A
  logbookMocks,
  dashboardMocks,
  workScheduleMocks,
  notificationsMocks,
  telephonyMocks,
  messagingMocks,
  // Трек B. WAGetMSGInstanceList — данные раздела-таблицы, но владелец метода — messaging.
  omitMocks(handbookMocks, [...SHARED, 'WAGetMSGInstanceList']),
  kanbanMocks,
  multiselectMocks,
  dentalMocks,
  billingMocks,
];

export const apiHandler = createApiHandler(...mockGroups);
