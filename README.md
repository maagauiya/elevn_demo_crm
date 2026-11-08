# Elevn CRM — фронтенд

Новый фронтенд CRM для клиник: React 19 + Vite + Tailwind v4 + shadcn/ui. Рефактор старого
фронтенда (CRA, React 17, antd + MUI + Redux) по дизайн-системе из [docs/design-system.md](docs/design-system.md).

Фронт разрабатывается поверх локального бэкенда и демо-базы (синтетические данные) из `../local-proj`.
Меню, таблицы, кнопки и формы приходят из базы — см. [правила работы с бэкендом](docs/CONTRIBUTING.md#локальный-бэкенд--правила).

## Быстрый старт

```bash
# 1. Бэкенд (нужен Docker и файл db/demo_opatra.fdb в local-proj)
cd ../local-proj && docker compose up -d firebird api

# 2. Фронт
cd ../elevn_demo_crm
nvm use            # Node из .nvmrc (22+)
corepack enable    # pnpm той версии, что в packageManager
pnpm install
pnpm dev           # http://localhost:5173, логин DemoOpatra / 123456789
```

Без Docker: `pnpm dev:mocks` — всё на MSW-моках.

| Команда                     | Что делает                                                            |
| --------------------------- | --------------------------------------------------------------------- |
| `pnpm dev`                  | dev-сервер с моками                                                   |
| `pnpm build`                | typecheck + прод-сборка в `dist/`                                     |
| `pnpm lint` / `pnpm format` | ESLint / Prettier                                                     |
| `pnpm typecheck`            | проверка типов                                                        |
| `pnpm test`                 | unit-тесты (Vitest)                                                   |
| `pnpm e2e`                  | e2e (Playwright; первый раз: `pnpm exec playwright install chromium`) |

В dev есть витрина UI-кита: http://localhost:5173/dev/kit

## Документы

- [docs/PLAN.md](docs/PLAN.md) — план рефактора и разделение на треки A/B
- [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) — как устроен код, как добавлять API, моки, компоненты
- [docs/sections.md](docs/sections.md) — реестр всех разделов меню: движок, маршрут, трек, статус
- [docs/backend-requests.md](docs/backend-requests.md) — что нужно от бэкенда (сами его не меняем)
- [docs/design-system.md](docs/design-system.md) — дизайн-система (источник истины по визуалу)
- [mockups/](mockups/) — HTML-мокапы журнала и дашборда (визуальный эталон)

## Переменные окружения

См. [.env.example](.env.example). Все `VITE_*` попадают в бандл и публичны — секретов там быть не должно.
