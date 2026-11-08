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
  }));

export type SessionUser = z.output<typeof loginRowSchema>;

export const emptyRowSchema = z.unknown();
