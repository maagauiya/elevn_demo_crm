import { setupServer } from 'msw/node';
import { apiHandler } from '@/app/mocks/handlers';

/** MSW в node с теми же моками, что и в браузере. Переопределяй через server.use(...) в тесте. */
export const server = setupServer(apiHandler);
