import { defineMocks, param } from '@/shared/mocks';

/**
 * Уведомления на синтетических данных: в демо-базе их нет. Типы — как в WANGetTypeList локального бэкенда.
 * Очередь всплывающих отдаёт два уведомления, после WANSetNotificationFloated они уходят из очереди.
 */
const TYPES = [
  { ID: '1', TYPEGROUPID: '1', NAME: 'Заканчивающийся товар', GROUPNAME: 'Сервисные', REFRESHMETHODNAME: '' },
  { ID: '4', TYPEGROUPID: '2', NAME: 'Задача', GROUPNAME: 'Задачи', REFRESHMETHODNAME: '' },
  { ID: '6', TYPEGROUPID: '4', NAME: 'Создана онлайн-запись', GROUPNAME: 'Онлайн-записи', REFRESHMETHODNAME: '' },
  { ID: '7', TYPEGROUPID: '5', NAME: 'Отменена запись', GROUPNAME: 'Отмены записей (клиентом)', REFRESHMETHODNAME: '' },
];

const row = (id: number, typeId: number, text: string, recId = 0) => ({
  ID: String(id),
  WANOTIFICATIONTYPEID: String(typeId),
  MSGTEXT: text,
  RECID: String(recId),
  CLIENTID: '0',
  OPERATIONDATE: '09.11.2026 10:15',
  TYPEGROUPID: '',
});

const LIST = [
  row(1, 6, 'Онлайн-запись: Смирнова Анна, 12:00, консультация', 900_100),
  row(2, 7, 'Клиент отменил запись на 15:30', 900_101),
  row(3, 1, 'Заканчивается товар: перчатки нитриловые (осталось 2 уп.)'),
  row(4, 4, 'Перезвонить клиенту по поводу плана лечения'),
];

// Как на сервере: «всплывшие» помним между перезагрузками страницы (в пределах вкладки).
const FLOATED_KEY = 'elevn.mock.floated';
const floated = new Set<string>(
  (() => {
    try {
      return JSON.parse(sessionStorage.getItem(FLOATED_KEY) ?? '[]') as string[];
    } catch {
      return [];
    }
  })(),
);

export const notificationsMocks = defineMocks({
  WANGetTypeList: () => TYPES,
  WANGetNotificationList: () => LIST,
  WANGetNotificationListTF: () => LIST.slice(0, 2).filter((n) => !floated.has(n.ID)),
  WANSetNotificationFloated: (req) => {
    floated.add(param(req, 'ParentId'));
    try {
      sessionStorage.setItem(FLOATED_KEY, JSON.stringify([...floated]));
    } catch {
      /* хранилище недоступно */
    }
    return [{ RESULT: '0', RESULTDESCRIPTION: 'OK' }];
  },
  WASGetAppBID: (req) => [{ APPDATE: param(req, 'AppId') ? '09.11.2026' : '' }],
});
