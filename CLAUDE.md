# CLAUDE.md

Контекст для Claude Code в этом репозитории.

## Что это

Новый фронтенд **Elevn CRM** (CRM для клиник) — рефактор старого фронтенда
(`/home/aldiyar/Desktop/self/local-proj/frontend`: CRA, React 17, antd + MUI + Redux).
Работают два человека параллельно по трекам A/B — см. `docs/PLAN.md` и реестр разделов `docs/sections.md`.

## Стек

Vite 8, React 19 (+ React Compiler), TypeScript 6 strict, Tailwind v4, shadcn/ui на Radix,
TanStack Query/Table/Virtual, Zustand, react-router 8, react-hook-form + zod, i18next, MSW, Vitest, Playwright. pnpm.

TypeScript держим на 6.x, пока typescript-eslint не поддерживает TS 7.

## Правила

- Перед версткой читать `docs/design-system.md`. Стили — только токены из `src/shared/styles/tokens.css`;
  нового токена нет в дизайн-системе → сначала дописать `docs/design-system.md`.
- Архитектура и границы импортов — `docs/CONTRIBUTING.md`. Не нарушать границы фич.
- Разработка идёт против локального бэкенда `../local-proj` (PHP-прокси → процедуры Firebird, демо-база
  с синтетическими данными): `docker compose up -d firebird api`, затем `pnpm dev`. Правила —
  `docs/CONTRIBUTING.md` → «Локальный бэкенд — правила». Коротко:
  - бэкенд и базу НЕ менять; нужное от бэкенда — в `docs/backend-requests.md`;
  - контракт метода брать из базы: `pnpm api:describe <Метод>`, не выдумывать;
  - разделы не хардкодить: меню из `WAGetNav`, тип пункта → движок (`features/navigation/model/item-types.ts`);
  - моки = снимки метаданных с бэкенда (`pnpm metadata:sync`) + faker для строк данных;
  - бэкенд уязвим к SQL-инъекциям: не подключать новый фронт к боевому бэкенду, `toBackendSafe` — не защита.
- Ответ API: `{ data, result, resultdescription }`; бизнес-ошибка может быть в `RESULT` первой строки.
- Секретов в коде и `VITE_*` нет. `dangerouslySetInnerHTML` запрещён.
- После изменений: `pnpm lint && pnpm typecheck && pnpm test` (и `pnpm e2e` для изменений в потоках).
- Коммитить только по явной просьбе пользователя.
