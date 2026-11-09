import { z } from 'zod';
import { apiField } from '@/shared/api';

/** Строка ответа WAEmpLogin (поля как в старом API). */
export const loginRowSchema = z
  .object({
    USERID: apiField.int,
    USERROLE: apiField.int,
    DOCID: apiField.int,
    MAINCOMPANYID: apiField.int,
    NAME: z.string(),
    DPOSITION: z.string().nullish(),
    DIMAGE: z.string().nullish(),
    DEFNAVITEMID: apiField.optionalString,
    ISATSON: apiField.bool.optional(),
    ATSSERVER: apiField.optionalString.optional(),
    ATSPASS: apiField.optionalString.optional(),
    INTNUMBER: apiField.optionalString.optional(),
  })
  .transform((row) => ({
    userId: row.USERID,
    role: row.USERROLE,
    docId: row.DOCID,
    companyId: row.MAINCOMPANYID,
    name: row.NAME,
    position: row.DPOSITION ?? '',
    photo: row.DIMAGE ?? null,
    defaultNavItemId: row.DEFNAVITEMID,
    /**
     * Телефония («Простые звонки»): сервер, пароль клиента и внутренний номер приходят в ответе логина.
     * Пароль нужен браузеру для подключения к серверу АТС — так устроен протокол (см. backend-requests.md).
     */
    ats: {
      enabled: row.ISATSON ?? false,
      server: row.ATSSERVER ?? null,
      password: row.ATSPASS ?? null,
      extension: row.INTNUMBER ?? null,
    },
  }));

export type SessionUser = z.output<typeof loginRowSchema>;

export const emptyRowSchema = z.unknown();
