# Barrier Lab

Інструмент для аналізу техніки бар'єрного бігу. Дозволяє записувати відео, автоматично розпізнавати пози спортсмена через MediaPipe, вимірювати кути суглобів по фазах бігу та відстежувати прогрес.

## Стек

**Frontend** — React 19, Vite, Mantine UI, Zustand, Dexie (IndexedDB), MediaPipe Tasks Vision, PWA

**Backend** — Hono, Node.js, Drizzle ORM, PostgreSQL, Better Auth, AWS S3

**Монорепо** — pnpm workspaces

## Функції

- Анотація відео з розпізнаванням поз у реальному часі
- Автовизначення фаз бар'єрного бігу (спринт між бар'єрами / підхід / схід з бар'єру)
- Вимірювання кутів суглобів з нормами по фазах
- Хронологія фаз (`PhaseTimeline`)
- Статистика та аналітика по сесіях
- Порівняння сесій
- Офлайн-режим (PWA + локальна БД)
- Інтерфейс українською та англійською мовами

## Локальний запуск

### Через Docker Compose (рекомендовано)

```bash
docker compose up
```

Сервіси:
- Web: http://localhost:5173
- API: http://localhost:3000
- PostgreSQL: localhost:5432

### Вручну

Передумови: Node.js 20+, pnpm, PostgreSQL

```bash
pnpm install

# запустити PostgreSQL та створити БД barrier_lab

# API
cp apps/api/.env.example apps/api/.env
pnpm dev:api

# Web (окремий термінал)
pnpm dev:web
```

## Змінні середовища

### API (`apps/api/.env`)

| Змінна | Опис |
|--------|------|
| `DATABASE_URL` | PostgreSQL connection string |
| `CORS_ORIGIN` | Дозволений origin фронтенду |
| `PORT` | Порт API (за замовчуванням 3000) |
| `AWS_ACCESS_KEY_ID` | AWS ключ для S3 |
| `AWS_SECRET_ACCESS_KEY` | AWS секрет для S3 |
| `AWS_REGION` | AWS регіон |
| `S3_BUCKET` | Назва S3 бакету для відео |

### Web (`apps/web/.env`)

| Змінна | Опис |
|--------|------|
| `VITE_API_URL` | URL бекенду |

## Структура монорепо

```
apps/
  api/          — Hono API сервер
  web/          — React PWA
packages/
  types/        — Спільні TypeScript типи
```

## Команди

```bash
pnpm dev:web          # запустити фронтенд
pnpm dev:api          # запустити API
pnpm build:web        # зібрати фронтенд
pnpm test             # запустити тести у всіх пакетах
```

## Продакшн (Docker)

```bash
docker compose --profile prod up
```

Збирає фронтенд та роздає через Nginx на порту 8080.
