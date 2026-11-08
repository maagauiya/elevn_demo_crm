import { setupWorker } from 'msw/browser';
import { apiHandler } from './handlers';

export async function startMockWorker() {
  const worker = setupWorker(apiHandler);
  await worker.start({
    onUnhandledFrame: 'bypass',
    quiet: true,
  });
  console.info('[mocks] MSW включён: все запросы к API обслуживаются моками');
}
