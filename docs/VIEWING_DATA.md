# Viewing User Data & Database

Quick start guide to view the User table with the new SSO provider fields.

## TL;DR - Fastest Way

### Web Interface (Recommended)

```bash
npm run -w apps/api -- npx prisma studio
```

Then:
1. Open `http://localhost:5555`
2. Click on "User" table
3. See all records with: `provider`, `providerAccountId`, `email`, `name`, `image`
4. Sign in via Google or GitHub on the web app to create new records

## Method 1: Prisma Studio (Visual - Best for Beginners)

```bash
# Start Prisma Studio
npm run -w apps/api -- npx prisma studio
```

- Opens web UI at `http://localhost:5555`
- Click table names to browse data
- Visual query builder
- Can edit/delete records directly
- No SQL knowledge needed

**To see User records:**
1. Click "User" table
2. View all columns: id, provider, providerAccountId, email, name, image

## Method 2: Command Line (psql)

```bash
# Connect to database
psql postgresql://postgres:153288@localhost:5432/habit_quest
```

View all users:
```sql
SELECT id, provider, "providerAccountId", email, name FROM "User";
```

Exit with `\q`

## Method 3: GUI Tools

### DBeaver (Free, recommended for detailed exploration)

1. Download: https://dbeaver.io/
2. Create new connection → PostgreSQL
3. Host: `localhost`
4. Port: `5432`
5. Database: `habit_quest`
6. Username: `postgres`
7. Password: `153288`
8. Browse tables visually in left sidebar

### TablePlus (macOS/Windows - Paid but excellent)

1. Download: https://tableplus.com/
2. Click "Create..." → "PostgreSQL"
3. Connection info same as above
4. Browse tables and data

### pgAdmin (Web-based - Free)

Usually available at `http://localhost:5050` if you have it running

## Understanding the User Fields

After SSO sign-in, a User record contains:

| Field | Example | Notes |
|-------|---------|-------|
| `id` | `c1a2b3c4d5e6f7g8` | Your local unique ID |
| `provider` | `google` or `github` | Which SSO provider |
| `providerAccountId` | `123456789` | Their ID from provider |
| `email` | `user@gmail.com` | From provider (optional) |
| `name` | `John Doe` | Display name |
| `image` | `https://...` | Avatar URL |

## Creating Test Data

1. Start the web and API servers:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000

3. Click "Sign in with Google" or "Sign in with GitHub"

4. After successful sign-in, a User record is automatically created

5. View it in Prisma Studio or query it with:
   ```sql
   SELECT * FROM "User" WHERE provider = 'google';
   ```

## Querying Examples

### Find your user

```sql
SELECT * FROM "User" WHERE email = 'your-email@example.com';
```

### See all Google users

```sql
SELECT id, email, name FROM "User" WHERE provider = 'google';
```

### See all GitHub users

```sql
SELECT id, "providerAccountId", name FROM "User" WHERE provider = 'github';
```

### See users without email (typical for GitHub)

```sql
SELECT id, "providerAccountId", name FROM "User" WHERE email IS NULL;
```

### Count users by provider

```sql
SELECT provider, COUNT(*) as count FROM "User" GROUP BY provider;
```

## Relationship to Habits

Each User can have many Habits:

In Prisma Studio:
- Click on a User record
- Scroll to see their "habits" relationship
- Click to view all habits created by that user

In SQL:
```sql
SELECT h.* FROM "Habit" h
WHERE h."userId" = 'YOUR_USER_ID';
```

## Troubleshooting

### "Cannot connect to database"

1. Verify PostgreSQL is running
2. Check `.env` file has correct DATABASE_URL:
   ```
   DATABASE_URL=postgresql://postgres:153288@localhost:5432/habit_quest
   ```
3. Test connection:
   ```bash
   psql postgresql://postgres:153288@localhost:5432/habit_quest -c "SELECT 1;"
   ```

### "No User records appear"

1. Haven't signed in yet - sign in on the web app first
2. Sign in didn't work - check backend logs:
   ```bash
   npm run dev -w apps/api
   ```

### "Email field is NULL"

This is normal for GitHub users who don't publicly expose their email. The user is still created with provider and providerAccountId.

## Next Steps

- [DATABASE_QUERIES.md](./DATABASE_QUERIES.md) - More SQL query examples
- [USER_AUTHENTICATION.md](./USER_AUTHENTICATION.md) - Full authentication documentation
- [CLAUDE.md](../.claude/CLAUDE.md) - Project authentication requirements
