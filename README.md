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
- PostgreSQL (local or remote instance)
- Google OAuth credentials (OIDC)
- GitHub OAuth credentials

### Installation & Running Locally

1. **Clone and install:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your values:
   # - DATABASE_URL (PostgreSQL connection string)
   # - AUTH_SECRET (min 32 chars, random)
   # - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET (from Google Cloud Console)
   # - GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET (from GitHub Settings)
   # - INTERNAL_SECRET (min 32 chars, random)
   ```

3. **Ensure PostgreSQL is running:**
   - Local instance: Make sure your PostgreSQL server is accessible at the URL in `DATABASE_URL`
   - Remote instance: Verify network connectivity to your PostgreSQL server

4. **Migrate database:**
   ```bash
   npm run db:push
   ```

5. **Run dev servers (frontend and backend together):**
   ```bash
   npm run dev
   ```

   Both servers run concurrently in separate processes:
   - **Frontend:** http://localhost:3000 (Next.js, App Router)
   - **Backend:** http://localhost:3001 (Express API)
   
   Both have automatic reload on file changes. Output from each server is prefixed with `[0]` (API) and `[1]` (Web).

### Running Frontend and Backend Separately

If you need to run them individually (e.g., for debugging):

```bash
# Terminal 1: Backend only
npm run dev:api

# Terminal 2: Frontend only  
npm run dev:web
```

The frontend requires the backend to be running at `http://localhost:3001` for API calls.

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

### Environment Variables Summary
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/habit-quest

# Auth (generate random 32+ char strings for secrets)
AUTH_SECRET=your-random-32-char-secret-here-1234567890ab
INTERNAL_SECRET=your-random-32-char-secret-here-abcd1234567890

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Frontend & Backend URLs (optional, defaults shown)
CORS_ORIGIN=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
```

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

## API Overview

### REST Endpoints

#### Habits Management
- `GET /api/habits` — List user's habits (params: search, status, sortBy, page, pageSize)
- `POST /api/habits` — Create habit (body: `{ name, description, status, frequency, targetDays }`)
- `GET /api/habits/:id` — Get habit details
- `PUT /api/habits/:id` — Update habit
- `DELETE /api/habits/:id` — Delete habit (cascades check-in history and notifications)

#### Check-Ins
- `POST /api/habits/:id/checkin` — Create check-in (body: `{ checkInDate }`); returns 409 if duplicate
- `GET /api/habits/:id/checkin` — List check-ins for a habit
- `GET /api/habits/:id/checkin/:date` — Get check-in for specific date

#### Authentication Routes (via Auth.js)
- `GET /auth/signin` — OAuth sign-in page
- `POST /auth/signin` — OAuth flow
- `GET /auth/callback/:provider` — OAuth callback
- `POST /auth/signout` — Sign-out

### Response Format
All API responses return JSON with 200/2xx for success, 4xx/5xx for errors. Authentication required on all endpoints except `/auth/signin`.

### Authorization
- All requests must include valid JWT in cookie (`AuthJS session cookie`)
- All queries filtered by `userId` — users see only their own data
- Archived habits cannot be modified or receive check-ins (403)
- Deleted habits return 404 (prevents resource enumeration)

## Habit Status Rules

Habits have three statuses: `ACTIVE`, `PAUSED`, `ARCHIVED`.

- **Check-ins:** Only `ACTIVE` habits accept new check-ins (`POST /api/habits/:id/checkin`). Checking in a `PAUSED` or `ARCHIVED` habit returns `403`.
- **Archived = read-only:** Once a habit is `ARCHIVED`, it cannot be modified in any way — no field updates (`PUT /api/habits/:id`) and no check-in changes, create or cancel (`POST`/`DELETE /api/habits/:id/checkin/...`), are permitted. All such requests return `403`. **Archiving is permanent** — there is no un-archive path.
- **Viewing and deleting** an archived habit remain available at any time.

### Habit Deletion

`DELETE /api/habits/:id` **cascades**: deleting a habit immediately and permanently removes it along with all of its check-in history (and any milestone notifications), regardless of the habit's current status. There is no "archive first" requirement.

This was a deliberate choice: since archiving is permanent, requiring archival before deletion would force every deletion through an irreversible dead-end state for no added safety. Cascading immediately keeps the existing delete-confirmation dialog as the single safety gate, rather than adding a second one that provides no real protection.

## WebSocket Events & Real-Time Sync

### Message Format

#### Client → Server

**`subscribe`** — Join user's real-time room and evaluate milestones
```json
{}
```
- Server derives `userId` from session JWT in connection handshake
- Joins socket to `user:<userId>` room for broadcasting
- Evaluates user's habits for milestone achievements

**`milestone:ack`** — Acknowledge received milestone notification
```json
{
  "notificationId": "notif_abc123"
}
```
- Marks notification as `acknowledged: true` in database
- Server verifies ownership (userId match)
- Prevents duplicate client-side notifications

#### Server → Client

**`habit:created`** — Habit was created
```json
{
  "id": "habit_123",
  "name": "Morning Run",
  "status": "ACTIVE",
  "currentStreak": 0,
  "bestStreak": 0,
  "checkedInToday": false
}
```

**`habit:checkedin`** — Habit was checked in (by this user or another session)
```json
{
  "habitId": "habit_123",
  "checkInDate": "2026-09-18",
  "checkedInToday": true
}
```

**`streak:updated`** — Streak metrics changed
```json
{
  "habitId": "habit_123",
  "currentStreak": 7,
  "bestStreak": 10
}
```

**`milestone`** — Habit reached a milestone
```json
{
  "notificationId": "notif_456",
  "habitId": "habit_123",
  "habitName": "Morning Run",
  "milestone": 7
}
```

### Milestone Notification Rules
- **Triggers:** When `currentStreak` reaches 3, 7, or 30 days
- **Deduplication:** Once per habit per milestone (unique constraint on `habitId_milestone`)
- **Eligibility:** Only for habits with status `ACTIVE`
- **Evaluation:** Triggered on `subscribe` event and after successful check-ins
- **Acknowledgment:** Client sends `milestone:ack`; server marks `acknowledged: true`
- **Broadcasting:** Notifications sent to entire `user:<userId>` room (all open sessions)

### Authentication
- WebSocket connection authenticated via Auth.js session cookie (set by browser automatically)
- Unauthenticated connections receive `connect_error`
- Verified JWT embedded in socket handshake; no manual token passing needed

## Testing

For complete test execution details, see [Test_Execution_Guide.md](test/Test_Execution_Guide.md).

### Quick Test Commands

```bash
# Run all tests
npm test

# Backend unit + integration tests
npm run test -w apps/api

# Frontend unit tests
npm run test -w apps/web

# E2E tests (Playwright)
npm run test:e2e

# Type checking
npm run typecheck

# Linting
npm run lint
```

### Common Test Patterns

```bash
# Run specific test file
npm test -w apps/api -- src/services/habit.service.test.ts

# Run tests matching pattern
npm test -- -t "authentication"

# Watch mode (re-run on file changes)
npm test -- --watch

# E2E tests with UI
npm run test:e2e -- --ui

# E2E tests in headed mode (see browser)
npm run test:e2e -- --headed
```

**Test Summary:** 177+ tests covering unit, integration (WebSocket), component, and E2E scenarios. All passing with 100% coverage of critical paths.

## Deployment

1. **Build:**
   ```bash
   npm run build
   ```

2. **Environment:**
   - Set production database URL, secrets, and CORS origin in env vars
   - Use strong AUTH_SECRET and INTERNAL_SECRET (min 32 chars)
   - Update CORS_ORIGIN and API URLs for your domain

3. **Database:** 
   - Ensure PostgreSQL is running and accessible
   - Run migrations:
     ```bash
     npm run db:migrate
     ```

4. **Start servers:**
   ```bash
   npm run start
   ```
   
   Both backend and frontend will start on their configured ports.

## Streak Calculation & Timezone Handling

### Timezone Behavior
- **UTC-based calculation:** All check-in dates and streak boundaries calculated in UTC calendar days
- **No per-user timezone storage:** System does not store user timezone preferences
- **Client-side responsibility:** Frontend must convert between UTC (backend) and user's local timezone for display and input
- **Database:** Check-in dates stored as `DATE` type (date-only, no time component) in PostgreSQL

### Streak Metrics
- **Current Streak:** Consecutive days of check-ins counted backward from today (UTC)
  - Broken if BOTH today and yesterday have no check-ins (single missed day doesn't break it)
  - Resets to 0 when streak is broken
- **Best Streak:** Highest consecutive day count ever achieved for this habit (never resets, only increases)
- **Check-in Logic:** One check-in per day, enforced by `UNIQUE(habitId, checkInDate)` constraint; duplicate attempt returns HTTP 409

### Calculation Algorithm
1. Query all check-ins for habit, sorted by date descending
2. Start from today (UTC) and count backward
3. If today's check-in missing, check yesterday
4. If both missing, streak is broken (currentStreak = 0)
5. Otherwise, continue counting consecutive days
6. Compare result with bestStreak and update if higher

## Habit Behavior

### Habit Statuses
- **ACTIVE:** Can receive new check-ins, can be updated. Initial default status.
- **PAUSED:** Cannot receive check-ins (returns 403). Can be viewed and updated.
- **ARCHIVED:** Read-only. Cannot receive check-ins, cannot be updated (returns 403). Archiving is permanent—no un-archive path.

### Habit Deletion
**`DELETE /api/habits/:id` immediately cascades:**
- Deletes the habit
- Removes all associated check-in history
- Removes all milestone notifications for that habit
- No "archive first" requirement; cascading is intentional to avoid forced dead-end states
- Deletion confirmation in UI serves as the single safety gate

**Check-in Cascading (Automatic):**
When a habit is deleted, its check-ins are automatically deleted by Prisma's `onDelete: Cascade` constraint in the schema.

## Development Notes

- **Validation:** Frontend (Zod schemas) + backend (Zod validation schemas) + DB constraints
- **CORS:** Enabled on API for frontend origin with `credentials: true` (cookies carry JWT)
- **Error Codes:** 
  - `404` on unauthorized access (prevents resource enumeration; used instead of 403)
  - `409` on duplicate check-in attempt (same habitId + checkInDate)
  - `403` on attempts to modify archived habits

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

