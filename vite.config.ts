/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Адрес локального бэкенда из local-proj (docker compose up -d firebird api).
  const apiTarget = loadEnv(mode, process.cwd(), '').API_PROXY_TARGET ?? 'http://localhost:8080';
  return {
    plugins: [react(), babel({ presets: [reactCompilerPreset()] }), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      // Запросы к /api.php проксируются на локальный бэкенд — тот же путь, что в проде за nginx.
      proxy: { '/api.php': { target: apiTarget, changeOrigin: true } },
    },
    build: {
      // Сорсмапы не публикуем в прод.
      sourcemap: false,
      rolldownOptions: {
        output: {
          // Vendor-библиотеки — отдельными чанками: они меняются реже кода приложения и дольше живут в кэше.
          codeSplitting: {
            groups: [
              { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler|react-router)[\\/]/, priority: 30 },
              { name: 'radix', test: /node_modules[\\/](@radix-ui|radix-ui|@floating-ui)[\\/]/, priority: 20 },
              { name: 'vendor', test: /node_modules[\\/]/, priority: 10 },
            ],
          },
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      css: false,
    },
  };
});
