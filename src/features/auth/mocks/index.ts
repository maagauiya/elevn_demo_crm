import { defineMocks } from '@/shared/mocks';

/** Те же учётные данные и формат ответа, что у локального бэкенда (демо-база). */
const DEMO = { login: 'DemoOpatra', password: '123456789' };

const EMPTY_ROW = {
  USERID: '',
  USERROLE: '',
  MAINCOMPANYID: '',
  DOCID: '',
  NAME: '',
  DPOSITION: '',
  DIMAGE: '',
  DEFNAVITEMID: '',
};

export const authMocks = defineMocks({
  // Как и настоящая процедура: ошибка входа — в RESULT строки, а конверт result: 0.
  WAEmpLogin: ({ ULogin, UPassword }) => {
    if (ULogin !== DEMO.login) return [{ ...EMPTY_ROW, RESULT: '1', RESULTDESCRIPTION: 'Пользователь не найден' }];
    if (UPassword !== DEMO.password) return [{ ...EMPTY_ROW, RESULT: '2', RESULTDESCRIPTION: 'Неправильный пароль' }];
    return [
      {
        RESULT: '0',
        RESULTDESCRIPTION: 'Ok',
        USERID: '1000004',
        USERROLE: '1',
        MAINCOMPANYID: '1',
        DOCID: '2005',
        NAME: 'Логинова Дарья',
        DPOSITION: 'Администратор',
        DIMAGE: '',
        DEFNAVITEMID: '97',
      },
    ];
  },
  WAEmpLogout: () => [],
});
