import { defineMocks, param } from '@/shared/mocks';

/** Телефония на синтетических данных. Карточка звонящего — в формате WA_ATS_ON_INCOMING_CALL. */
export const telephonyMocks = defineMocks({
  WAATSOnIncomingCall: (req) => [
    {
      RESULT: '0',
      RESULTDESCRIPTION: 'Ок',
      CLIENTID: '5000',
      CLIENTNAME: 'Смирнова Анна Петровна',
      CLIENTPHONE: param(req, 'Cellphone'),
      BONUSAMOUNT: '1200',
      LASTVISITDATE: '26.10.2026',
      LASTMANIPULATION: 'Профгигиена',
      LASTVISITDOCTOR: 'Петрова А. С.',
      LASTMATERIAL: '',
      NEXTVISITDATE: 'НЕТ',
      NEXTMANIPULATION: '',
      NEXTVISITDOCTOR: '',
      BELOVEDDOCTOR: 'Петрова А. С.,Ким Д. В.',
      BELOVEDDEP: '',
      NOTVISITEDDEP: '',
      CLCOMMENT: '',
    },
  ],
  WAATSOnCallEnd: () => [{ ADDEDID: '1', RESULT: '0', RESULTDESCRIPTION: 'Ок' }],
  WAATSSetIntNumber: () => [{ RESULT: '0', RESULTDESCRIPTION: 'Внутренний номер изменён' }],
});
