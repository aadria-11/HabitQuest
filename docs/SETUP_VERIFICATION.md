# Setup Verification Guide

After implementing SSO provider identity persistence, verify everything works correctly.

## Database Setup Verification

### 1. Reset Database (if needed)

If you see database schema errors in Prisma Studio, reset the dev database:

```bash
cd apps/api
npx prisma migrate reset --force
```

This will:
- Drop all tables
- Reapply all migrations in order
- Regenerate Prisma Client
- Ready for fresh testing

### 2. Verify User Table Schema

Open Prisma Studio:
```bash
npm run -w apps/api -- npx prisma studio
```

Navigate to the "User" table and verify these columns exist:
- ✅ `id` - CUID
- ✅ `provider` - String (e.g., "google", "github")
- ✅ `providerAccountId` - String
- ✅ `email` - String (nullable)
- ✅ `name` - String (nullable)
- ✅ `image` - String (nullable)
- ✅ `createdAt` - DateTime
- ✅ `updatedAt` - DateTime

### 3. Verify HabitCheckIn Table

In Prisma Studio, click "HabitCheckIn" and verify:
- ✅ `id` - CUID
- ✅ `habitId` - String (FK to Habit)
- ✅ `checkInDate` - Date
- ✅ `comment` - String (nullable)
- ✅ `createdAt` - DateTime

If `comment` column is missing, run the reset above.

## Backend Verification

### 1. Start API Server

```bash
npm run dev -w apps/api
```

Should start without errors and show:
```
> api@0.1.0 dev
> tsx watch src/index.ts
```

### 2. Test Health Endpoint

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{"status":"ok"}
```

### 3. Check Logs

Monitor the API logs for any TypeErrors or schema mismatches. The startup should be clean.

## Frontend Verification

### 1. Start Web App

```bash
npm run dev -w apps/web
```

Should start Next.js dev server on http://localhost:3000

### 2. Sign In Flow

1. Navigate to http://localhost:3000
2. Click "Sign in with Google" or "Sign in with GitHub"
3. Complete OAuth flow
4. Should redirect to dashboard

### 3. Verify User Created

After signing in, check Prisma Studio:
- User table should have a new record
- `provider` should be "google" or "github"
- `providerAccountId` should be populated
- `email` should be populated (Google) or null (GitHub if not public)

## Feature Verification

### 1. Create Habit

1. Click "New Habit" on dashboard
2. Fill in: Name, Description, Start Date, Status
3. Click "Create"

Should appear in habit list.

### 2. Check In Habit

1. Click on a habit
2. Click "Check in" button
3. Should show success message

If you see "Internal server error":
- Check API logs for the actual error
- Run `prisma migrate reset --force` to reset database
- Verify all migrations applied

### 3. View Streaks

After checking in:
- Current Streak should update to 1
- Best Streak should show 1

### 4. Check Data in Prisma Studio

Click "HabitCheckIn" table and verify:
- New record created for today
- `habitId` references the habit
- `checkInDate` is today's date
- `comment` field exists (even if null)

## Troubleshooting

### "Invalid... column `HabitCheckIn.comment` does not exist"

**Cause**: Database schema out of sync with migrations

**Solution**:
```bash
cd apps/api
npx prisma migrate reset --force
```

### "Internal server error" on check-in

**Cause**: Usually a database or type issue

**Solution**:
1. Check API logs: `npm run dev -w apps/api`
2. Look for TypeErrors or database errors
3. If schema errors, reset: `npx prisma migrate reset --force`

### Email field always null after sign-in

**Normal behavior for GitHub users** who don't publicly expose email. They're still authenticated with:
- `provider`: "github"
- `providerAccountId`: their GitHub user ID

### Multiple users with same email

**Normal behavior**. Can happen if user signs in with both Google and GitHub. Each has:
- Different `provider`
- Different `providerAccountId`

Query them separately in Prisma Studio or with:
```sql
SELECT * FROM "User" WHERE email = 'user@example.com';
```

## Quick Test Checklist

After setup, run through this checklist:

- [ ] `npm run dev -w apps/api` starts without errors
- [ ] `npm run dev -w apps/web` starts without errors
- [ ] Sign in with Google works
- [ ] User record created in Prisma Studio with provider="google"
- [ ] Can create a habit
- [ ] Can check in a habit without "Internal server error"
- [ ] Check-in creates HabitCheckIn record with comment column
- [ ] Streak updates after check-in
- [ ] Sign in with GitHub works
- [ ] GitHub user record has email=null (if not public)
- [ ] GitHub user can create habits and check in

## Environment Variables

Verify these are set in `.env`:

```env
# Database
DATABASE_URL=postgresql://postgres:153288@localhost:5432/habit_quest

# Google OAuth
GOOGLE_CLIENT_ID=your_id
GOOGLE_CLIENT_SECRET=your_secret

# GitHub OAuth
GITHUB_CLIENT_ID=your_id
GITHUB_CLIENT_SECRET=your_secret

# Auth
AUTH_SECRET=your_random_secret
INTERNAL_SECRET=your_internal_secret

# API
NEXT_PUBLIC_API_URL=http://localhost:3001
```

If any are missing or wrong:
- Google/GitHub sign-in will fail
- Sync endpoint won't authenticate
- Backend won't start

## Database Connection

If tests fail to connect:

```bash
# Verify PostgreSQL running
psql postgresql://postgres:153288@localhost:5432/habit_quest -c "SELECT 1;"

# Should respond with:
# ?column?
# ----------
#         1
```

If connection fails:
1. Verify PostgreSQL is running
2. Check host/port/credentials in .env
3. Check database "habit_quest" exists

## Next Steps

- [VIEWING_DATA.md](./VIEWING_DATA.md) - How to browse and query data
- [DATABASE_QUERIES.md](./DATABASE_QUERIES.md) - Common SQL queries
- [USER_AUTHENTICATION.md](./USER_AUTHENTICATION.md) - Full auth documentation
