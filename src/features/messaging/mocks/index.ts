import { defineMocks } from '@/shared/mocks';

/** Инстансы WhatsApp на синтетических данных. Токен — фиктивный, в формате "idInstance.apiToken". */
export const messagingMocks = defineMocks({
  WAGetMSGInstanceList: () => [
    {
      ID: '1',
      NAME: 'Главный офис',
      WATOKEN: '1100000000.mock-token',
      DESCRIPTION: 'Рассылки и напоминания клиентам',
      ISDEFAULT: 'Да ',
      INSTANCETYPEID: '0',
      INSTANCETYPENAME: 'WhatsApp',
    },
  ],
});
