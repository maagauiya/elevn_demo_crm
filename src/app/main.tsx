import '@/shared/styles/index.css';
import '@/shared/i18n';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';
import { Providers } from './providers';
import { router } from './router';

async function bootstrap() {
  // Выражение продублировано из env.apiMocks намеренно: так Vite выкидывает чанк моков из прод-сборки.
  if (import.meta.env.VITE_API_MOCKS === 'true') {
    // Моки грузятся отдельным чанком и не попадают в прод-бандл без VITE_API_MOCKS=true.
    const { startMockWorker } = await import('./mocks/browser');
    await startMockWorker();
  }

  const root = document.getElementById('root');
  if (!root) throw new Error('#root not found');
  createRoot(root).render(
    <StrictMode>
      <Providers>
        <RouterProvider router={router} />
      </Providers>
    </StrictMode>,
  );
}

void bootstrap();
