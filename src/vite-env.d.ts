/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_MOCKS?: string;
  readonly VITE_API_URL?: string;
  /** Симулятор АТС вне режима моков (для проверки телефонии против локального бэкенда). */
  readonly VITE_ATS_SIMULATOR?: string;
  /** Прямые запросы к Green API из браузера, как в старом фронте. Выключено: токены не должны попадать во фронт. */
  readonly VITE_WHATSAPP_DIRECT?: string;
  readonly VITE_GREEN_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
