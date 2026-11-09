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
import { createApiHandler } from '@/shared/mocks';

/** Все моки приложения. Новая фича → одна строка здесь (уже добавлены все из плана). */
export const apiHandler = createApiHandler(
  authMocks,
  navigationMocks,
  itemParamsMocks,
  // Трек A
  logbookMocks,
  dashboardMocks,
  workScheduleMocks,
  notificationsMocks,
  telephonyMocks,
  messagingMocks,
  // Трек B
  handbookMocks,
  kanbanMocks,
  multiselectMocks,
  dentalMocks,
  billingMocks,
);
