import '@testing-library/jest-dom/vitest';
import '@/shared/i18n';
import { cleanup } from '@testing-library/react';
import { setMockLatency } from '@/shared/mocks';
import { server } from './server';

setMockLatency(0);

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());
