# Auth + Backend Migration Design

**Date:** 2026-06-03  
**Status:** Approved for implementation

## Overview

Migrate barrier-lab from a fully local PWA (Dexie + OPFS) to a cloud-backed architecture with authentication. Users authenticate via email/password or Google OAuth. Run metadata lives in PostgreSQL; videos stay in OPFS locally and are backed up to Cloudflare R2 asynchronously.

## Goals

- Email/password + Google OAuth authentication
- Cross-device sync for runs and annotations
- Season-level statistics and progress tracking
- Data protection — unauthenticated users cannot access any data
- Offline-capable — Dexie as local cache, sync on reconnect
- Low infrastructure cost (~$5-10/month)
- Schema extensible to coach/athlete teams and run sharing

## Non-Goals (this iteration)

- Coach/athlete team management (tables created, logic deferred)
- Public run sharing links (table created, logic deferred)
- Video transcoding or streaming optimisation
- Native mobile app

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React PWA (existing) |
| Auth | better-auth (email/password + Google OAuth) |
| API | Node.js + Hono |
| ORM | Drizzle ORM |
| Database | PostgreSQL (Railway) |
| Video storage | Cloudflare R2 |
| Local cache | Dexie + OPFS (existing) |
| Hosting | Railway (~$5-10/month) |

## Database Schema

better-auth manages `users`, `sessions`, `accounts` tables automatically.

```sql
-- User profile (1:1 with better-auth users)
profiles (
  id            uuid PK  → users.id
  display_name  text
  role          enum('athlete', 'coach')   default 'athlete'
  created_at    timestamptz
)

-- Seasons — grouping of runs
seasons (
  id           uuid PK
  user_id      uuid → profiles
  name         text          -- e.g. "2024 Indoor Season"
  discipline   text          -- e.g. '110mH', '100mH'
  started_at   date
  ended_at     date nullable -- null = active season
  created_at   timestamptz
)

-- Runs — migrated from Dexie
runs (
  id              uuid PK
  user_id         uuid → profiles
  season_id       uuid → seasons nullable
  name            text
  discipline      text
  date            date
  events          jsonb     -- [{type, t, hurdle_n}]
  notes           text
  video_key       text nullable     -- R2 object key
  video_uploaded  boolean default false
  created_at      timestamptz
)

-- FUTURE: coach ↔ athlete relationships
team_memberships (
  id          uuid PK
  coach_id    uuid → profiles
  athlete_id  uuid → profiles
  status      enum('pending', 'active', 'revoked')
  created_at  timestamptz
)

-- FUTURE: per-run sharing (public link or specific user)
run_shares (
  id           uuid PK
  run_id       uuid → runs
  shared_with  uuid → profiles nullable  -- null = public link
  token        text nullable
  created_at   timestamptz
)
```

All tables use **Row Level Security**: every query is filtered by `user_id = current_user_id()`. `team_memberships` and `run_shares` tables are created now but have no API endpoints in this iteration.

## API Routes (Hono)

```
Auth — handled by better-auth Hono adapter:
  POST  /api/auth/sign-up/email
  POST  /api/auth/sign-in/email
  POST  /api/auth/sign-in/social     ← Google
  POST  /api/auth/sign-out
  GET   /api/auth/session

Seasons:
  GET    /api/seasons
  POST   /api/seasons
  PATCH  /api/seasons/:id
  DELETE /api/seasons/:id

Runs:
  GET    /api/runs                   ?season_id= &limit= &offset=
  POST   /api/runs
  GET    /api/runs/:id
  PATCH  /api/runs/:id               ← save annotations
  DELETE /api/runs/:id

Video (presigned URLs — traffic goes client ↔ R2 directly):
  POST   /api/runs/:id/video-upload-url  → presigned PUT URL
  GET    /api/runs/:id/video-url         → presigned GET URL (1h TTL)
  DELETE /api/runs/:id/video

Future (no-op endpoints, not implemented now):
  POST   /api/team/invite
  GET    /api/team/members
  POST   /api/runs/:id/share
  GET    /api/shared/:token
```

All API routes except auth require a valid session cookie. Requests without a session return 401.

## Auth Flow

```
Email/Password registration:
  POST /api/auth/sign-up/email
  → better-auth creates user + triggers profile creation hook
  → session cookie set → redirect to /

Email/Password login:
  POST /api/auth/sign-in/email
  → session cookie set → redirect to /

Google OAuth:
  GET /api/auth/sign-in/social?provider=google
  → Google consent screen
  → callback handled by better-auth
  → session cookie set → redirect to /

Session lifecycle:
  - Cookie sent automatically with every request
  - GET /api/auth/session checked on frontend app start
  - Expired/missing session → redirect to /login
```

## Video Upload Flow

The API server never proxies video bytes — only issues presigned URLs.

```
1. POST /api/runs              → create run record in PostgreSQL
2. POST /api/runs/:id/video-upload-url  → get presigned PUT URL from R2
3. PUT <presigned-url>         → browser uploads directly to R2
4. PATCH /api/runs/:id         → {video_uploaded: true}
```

Video playback uses a short-lived presigned GET URL from `/api/runs/:id/video-url`. If the video is cached in OPFS, OPFS is used instead (faster, offline-capable).

## Frontend Changes

### New files

```
src/
  features/auth/
    LoginPage.tsx          ← email/password form + Google button
    RegisterPage.tsx       ← email/password registration form
  components/
    AuthGuard.tsx          ← redirects unauthenticated users to /login
  store/
    auth.ts                ← Zustand store: { user, session, loading }
  lib/
    apiClient.ts           ← fetch wrapper with base URL + credentials:include
```

### Modified files

```
src/router.tsx             ← split into public (/login, /register) and
                             protected routes (wrapped by AuthGuard)
src/components/Layout.tsx  ← add user avatar + logout button in header
src/store/runs.ts          ← API-first: POST/GET/PATCH/DELETE via apiClient,
                             Dexie updated as local cache after each response
```

### Sync strategy

```
Online:  API (PostgreSQL) is source of truth
         ↓ on app start
         GET /api/runs → replace Dexie cache with server data

Offline: Dexie serves cached data
         mutations queued in localStorage (pendingSync)
         ↓ on reconnect
         flush pendingSync queue to API
```

### Route structure

```
Public:
  /login       → LoginPage
  /register    → RegisterPage

Protected (AuthGuard):
  /            → DashboardPage
  /annotate/:runId
  /stats/:runId
  /analytics/:runId
  /trends
  /compare
```

## Local Data Migration

One-time migration on first login:

```
1. Read all runs from Dexie
2. POST /api/runs for each (batch, with error handling per item)
3. Set localStorage.migrated = true
4. From this point: API is source of truth, Dexie is cache only
```

If a run fails to migrate, it remains in Dexie and is retried on next login.

## Project Structure (API)

```
apps/api/
  src/
    index.ts          ← Hono app entry, better-auth mount
    db/
      schema.ts       ← Drizzle schema (mirrors DB schema above)
      index.ts        ← Drizzle client
    routes/
      runs.ts
      seasons.ts
      video.ts
    lib/
      r2.ts           ← Cloudflare R2 presigned URL helpers
      auth.ts         ← better-auth instance config
  drizzle.config.ts
  package.json
```

Monorepo structure (pnpm workspaces): existing React app moves to `apps/web/`, API lives in `apps/api/`. Shared types extracted to `packages/types/`. This keeps one repo, one git history, type-safe contracts between frontend and API.

## Environment Variables

```
API:
  DATABASE_URL          ← Railway PostgreSQL connection string
  BETTER_AUTH_SECRET    ← random 32-byte secret
  GOOGLE_CLIENT_ID      ← Google OAuth app
  GOOGLE_CLIENT_SECRET
  R2_ACCOUNT_ID
  R2_ACCESS_KEY_ID
  R2_SECRET_ACCESS_KEY
  R2_BUCKET_NAME
  CORS_ORIGIN           ← frontend URL

Frontend:
  VITE_API_URL          ← Railway API URL
```

## Future Extensibility

The schema is designed to accommodate:

- **Teams:** `team_memberships` table allows coaches to view athlete runs via RLS policy extension — no schema change needed
- **Sharing:** `run_shares` table supports both targeted sharing and public links — add endpoints when needed
- **Season analytics:** `seasons` table enables filtering all stats by season — queries already parameterised by `season_id`
- **Multiple disciplines per season:** `runs.discipline` is independent of `seasons.discipline` — a season can contain mixed disciplines if needed
- **Notifications:** add `notifications` table linked to `team_memberships` events — no breaking changes
