# HabitQuest

A multi-user web application for tracking daily habits with real-time synchronization across browser sessions. Built with Next.js, Express, PostgreSQL, and Socket.IO.

## Features

- **SSO Authentication** — Google and GitHub sign-in via Auth.js
- **Habit Management** — Create, edit, delete, and manage personal habits
- **Daily Check-Ins** — Log daily habit completion with streak tracking
- **Streak Calculation** — Current and best streak metrics
- **Real-Time Sync** — Multi-tab WebSocket synchronization (when one tab checks in, others update live)
- **User Isolation** — Complete data isolation per user; no cross-user access

## Tech Stack

**Frontend:**
- Next.js 16 (App Router, TypeScript)
- React 19
- TanStack Query (React Query)
- Socket.IO Client
- Tailwind CSS
- shadcn/ui

**Backend:**
- Node.js / Express
- TypeScript
- Prisma ORM
- Socket.IO
- PostgreSQL

**Auth:**
- Auth.js (next-auth)
- Google OIDC
- GitHub

**Testing:**
- Vitest
- React Testing Library
- Supertest
- Playwright (E2E)

## Project Structure

```
habit-quest/
├── apps/
│   ├── web/              # Next.js frontend
│   └── api/              # Express backend
├── packages/
│   └── shared/           # Shared Zod schemas & TS types
├── e2e/                  # Playwright E2E tests (placeholder)
├── docker-compose.yml    # Local PostgreSQL
└── package.json          # npm workspaces root
```

## Getting Started

### Prerequisites

- Node.js ≥ 20
- Docker (for local PostgreSQL)
- Google OAuth credentials (OIDC)
- GitHub OAuth credentials

### Installation

1. **Clone and install:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your values:
   # - DATABASE_URL (PostgreSQL connection)
   # - AUTH_SECRET (min 32 chars, random)
   # - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET (from Google Cloud Console)
   # - GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET (from GitHub Settings)
   # - INTERNAL_SECRET (min 32 chars, random)
   ```

3. **Start PostgreSQL:**
   ```bash
   docker-compose up -d
   ```

4. **Migrate database:**
   ```bash
   npm run db:push
   ```

5. **Run dev servers:**
   ```bash
   npm run dev
   ```

   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

## OAuth Configuration

### Google OIDC Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable OAuth 2.0 credentials (OAuth consent screen → Create credentials)
4. Add redirect URI: `http://localhost:3000/api/auth/callback/google` (production: `https://your-domain/api/auth/callback/google`)
5. Copy Client ID and Secret to `.env` as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

### GitHub OAuth Setup
1. Go to GitHub Settings → Developer settings → OAuth Apps → New OAuth App
2. Set Authorization callback URL: `http://localhost:3000/api/auth/callback/github` (production: `https://your-domain/api/auth/callback/github`)
3. Copy Client ID and Secret to `.env` as `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`

## Architecture

### Authentication Flow

1. User visits `/` → redirects to `/login` if not authenticated
2. Clicks "Sign in with Google" or "Sign in with GitHub" → Auth.js redirects to provider
3. After sign-in, Auth.js `jwt` callback:
   - Calls Express `POST /internal/users/sync` to upsert user in Prisma
   - Receives back internal `userId`
   - Embeds `{ userId, email, name }` in JWT cookie
4. Every API request (REST or WebSocket) verifies JWT with shared `AUTH_SECRET`
5. All habit queries scoped by `where: { userId: req.user.id }`

### Authorization

- **Cross-user protection:** 404 (not 403) on unauthorized access, to avoid confirming resource existence
- **Service-layer enforcement:** User scoping in `*Service` functions, not just controllers
- **Per-user WebSocket rooms:** Each user joins `user:<userId>` room; broadcasts target only that room

### Real-Time Sync

When a check-in happens:
1. REST endpoint updates database transactionally
2. Service emits `habit:checkedin` and `streak:updated` events to user's WebSocket room
3. All tabs subscribed to that room receive the event
4. React Query cache patched via `useHabitSocket` hook
5. UI re-renders instantly without reload

## Key Files

**Frontend:**
- `app/lib/auth.ts` — Auth.js config (Google & GitHub providers)
- `app/lib/api-client.ts` — Typed fetch wrapper with credential handling
- `app/lib/socket.ts` — Socket.IO client singleton
- `app/hooks/` — React Query hooks (useHabits, useCreateHabit, useCheckIn, etc.)
- `app/(dashboard)/habits/[id]/page.tsx` — Habit detail page with check-in UI

**Backend:**
- `src/middleware/auth.ts` — JWT verification (REST + WebSocket)
- `src/services/` — Business logic (habit, checkin, streak, user)
- `src/sockets/index.ts` — Socket.IO setup, per-user rooms
- `prisma/schema.prisma` — Data model (User, Habit, HabitCheckIn)

**Shared:**
- `packages/shared/src/types.ts` — TS interfaces (Habit, User, JWT, WS events)
- `packages/shared/src/schemas.ts` — Zod validation schemas

## API Endpoints

### Habits

- `GET /api/habits` — List habits (params: search, status, sortBy, page, pageSize)
- `POST /api/habits` — Create habit
- `GET /api/habits/:id` — Get habit details
- `PUT /api/habits/:id` — Update habit
- `DELETE /api/habits/:id` — Delete habit

### Check-Ins

- `POST /api/habits/:id/checkin` — Create check-in (body: `{ checkInDate }`)
- `GET /api/habits/:id/checkin` — List check-ins for a habit

### Auth Routes (via Auth.js)

- `GET /auth/signin` — Sign-in page redirect
- `POST /auth/signin` — OAuth flow
- `GET /auth/callback` — OAuth callback
- `POST /auth/signout` — Sign-out

## Habit Status Rules

Habits have three statuses: `ACTIVE`, `PAUSED`, `ARCHIVED`.

- **Check-ins:** Only `ACTIVE` habits accept new check-ins (`POST /api/habits/:id/checkin`). Checking in a `PAUSED` or `ARCHIVED` habit returns `403`.
- **Archived = read-only:** Once a habit is `ARCHIVED`, it cannot be modified in any way — no field updates (`PUT /api/habits/:id`) and no check-in changes, create or cancel (`POST`/`DELETE /api/habits/:id/checkin/...`), are permitted. All such requests return `403`. **Archiving is permanent** — there is no un-archive path.
- **Viewing and deleting** an archived habit remain available at any time.

### Habit Deletion

`DELETE /api/habits/:id` **cascades**: deleting a habit immediately and permanently removes it along with all of its check-in history (and any milestone notifications), regardless of the habit's current status. There is no "archive first" requirement.

This was a deliberate choice: since archiving is permanent, requiring archival before deletion would force every deletion through an irreversible dead-end state for no added safety. Cascading immediately keeps the existing delete-confirmation dialog as the single safety gate, rather than adding a second one that provides no real protection.

## WebSocket Events

**Authentication:**
- The WebSocket connection is authenticated via the Auth.js session cookie (automatically sent by the browser).
- Unauthenticated handshakes are rejected; the connection receives a `connect_error`.

**Client → Server:**
- `subscribe` — Join user's per-user room (payload: `{}` — server derives `userId` from the verified session cookie)
- `milestone:ack` — Acknowledge milestone notification (payload: `{ notificationId }`, ownership verified server-side)

**Server → Client:**
- `milestone` — Milestone reached (payload: `{ notificationId, habitId, habitName, milestone }`, broadcast to all of user's connected sessions)

**Milestone Notification Rules:**
- Triggers when `currentStreak` reaches 3, 7, or 30 days
- Only sent once per habit per milestone (deduplicated by `habitId_milestone` unique constraint)
- Only for habits with status `ACTIVE`
- Evaluated when the WebSocket connection opens (on `subscribe`)
- Acknowledged via `milestone:ack` event; server verifies ownership and updates `acknowledged: true` in DB
- Notifications broadcast to all of a user's open sessions in the `user:<userId>` room, not just the subscribing socket

## Testing

```bash
# Frontend unit tests
npm run test -w apps/web

# Backend unit + integration tests
npm run test -w apps/api

# Type checking
npm run typecheck

# Linting
npm run lint
```

> E2E tests with Playwright are scaffolded but not yet implemented. A test-only auth bypass is needed for CI to seed sessions without interactive OAuth login.

## Deployment

1. **Build:**
   ```bash
   npm run build
   ```

2. **Docker images** — Dockerfiles and compose file are placeholders; customize for production

3. **Environment:**
   - Set production database URL, secrets, and CORS origin in env vars
   - Use strong AUTH_SECRET and INTERNAL_SECRET (min 32 chars)

4. **Database:** Run migrations:
   ```bash
   npm run db:migrate
   ```

## Development Notes

- **Timezone:** Check-in dates and streak boundaries are calculated in UTC calendar days. No per-user timezone is stored. The UI is responsible for converting between UTC and the user's local timezone for display and input.
- **Streaks:** Calculated from check-in history. Current streak is broken if both today (in UTC) and yesterday are missing check-ins. Best streak is the highest consecutive days ever achieved.
- **Validation:** Frontend (Zod schemas) + backend (Zod validation schemas) + DB constraints
- **CORS:** Enabled on API for frontend origin with `credentials: true` (cookies carry JWT)

## Definition of Done

✅ Users authenticate via Google and GitHub OAuth  
✅ Users only see their own habits  
✅ Habit CRUD operations work  
✅ Daily check-ins with one-per-day rule (409 on duplicate)  
✅ Current and best streak calculation  
✅ Real-time WebSocket sync across tabs  
✅ Frontend components with state indicators  
✅ Backend auth middleware + service-layer scoping  
✅ API routes per TECH_SPEC.md  
✅ Shared Zod schemas  

## Next Steps (Beyond MVP)

- Habit reminders / notifications
- Habit notes / comments
- Analytics / progress charts
- Habit recommendations / suggestions
- Bulk import / export
- Dark mode toggle
- Mobile app (React Native)
- API rate limiting
- Full E2E test suite
- Performance optimizations (caching, pagination)

