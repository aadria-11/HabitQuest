# User Authentication & SSO Provider Identity

## Overview

HabitQuest uses SSO-only authentication with Google OAuth and GitHub OAuth. On first successful sign-in, the backend automatically creates a local user record with SSO provider details.

## SSO Providers

- **Google** - OAuth provider
- **GitHub** - OAuth provider

## User Record Creation

### Automatic Creation Flow

1. User signs in via Google or GitHub on the web app
2. Next.js Auth.js handles the OAuth callback
3. JWT callback extracts provider information from the OAuth account
4. Frontend sends POST to `/internal/users/sync` with provider details
5. Backend creates or updates local User record
6. User session is established with the local user ID

### Provider Identity

Users are uniquely identified by the composite key: `(provider, providerAccountId)`

This ensures:
- Each provider's users are isolated even if they share the same email
- Support for providers that don't expose email (e.g., GitHub)
- Secure, stable user identification

## User Record Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | String (CUID) | Yes | Local unique identifier |
| `provider` | String | Yes | OAuth provider name (e.g., "google", "github") |
| `providerAccountId` | String | Yes | Provider's stable user ID |
| `email` | String | No | Email address (not all providers expose this) |
| `name` | String | No | Display name from provider profile |
| `image` | String | No | Avatar URL from provider profile |
| `createdAt` | DateTime | Yes | Record creation timestamp (UTC) |
| `updatedAt` | DateTime | Yes | Last update timestamp (UTC) |

## Viewing User Data

### Option 1: Prisma Studio (Recommended)

Visual web interface for browsing database tables:

```bash
# From repository root
npm run -w apps/api -- npx prisma studio
```

Opens at `http://localhost:5555`

**In Prisma Studio:**
- Click the "User" table
- View all records with provider, email, name, image fields
- Filter, edit, and delete records
- See relationship to Habits

### Option 2: Direct Database Query

Connect to PostgreSQL and query directly:

```bash
psql postgresql://postgres:153288@localhost:5432/habit_quest
```

View User table structure:
```sql
\d "User"
```

View all users:
```sql
SELECT id, provider, "providerAccountId", email, name, image, "createdAt" 
FROM "User"
ORDER BY "createdAt" DESC;
```

View users from specific provider:
```sql
SELECT id, "providerAccountId", email, name 
FROM "User" 
WHERE provider = 'google';
```

Find user by provider account ID:
```sql
SELECT * FROM "User" 
WHERE provider = 'github' AND "providerAccountId" = '12345678';
```

### Option 3: GUI Database Tools

Use a database client with PostgreSQL support:

**DBeaver** (Free, recommended)
- Download: https://dbeaver.io/
- Connect with: `postgresql://postgres:153288@localhost:5432/habit_quest`
- Browse tables visually
- Execute SQL queries

**pgAdmin**
- Web-based PostgreSQL management
- Port: typically 5050

**TablePlus**
- macOS/Windows desktop app
- Paid but excellent interface

**VS Code PostgreSQL Extension**
- Search "PostgreSQL" in VS Code Extensions
- Add connection in VS Code UI

## User Sync Endpoint

**Internal API only** - called from Next.js during authentication

```
POST /internal/users/sync
Headers: x-internal-secret: [INTERNAL_SECRET]
Body: {
  provider: "google" | "github",
  providerAccountId: "...",
  email: "user@example.com" (optional),
  name: "User Name" (optional),
  image: "https://..." (optional)
}
```

Response:
```json
{
  "userId": "c1a2b3c4..."
}
```

## Data Examples

### Google Sign-In Record

```
id: clx9k2v5f0000qz3g7x4q3x3g
provider: google
providerAccountId: 123456789012345678901
email: john.doe@gmail.com
name: John Doe
image: https://lh3.googleusercontent.com/a/...
createdAt: 2026-09-14T16:45:23.000Z
updatedAt: 2026-09-14T16:45:23.000Z
```

### GitHub Sign-In Record

```
id: clx9k2v5f0000qz3g7x4q3x3h
provider: github
providerAccountId: 98765432
email: null (not all GitHub users expose email)
name: jane_doe
image: https://avatars.githubusercontent.com/u/...
createdAt: 2026-09-14T17:12:45.000Z
updatedAt: 2026-09-14T17:12:45.000Z
```

## Security Considerations

### User Isolation

All backend queries must filter by authenticated user ID:

```typescript
// Good - only user's data
const habits = await prisma.habit.findMany({
  where: {
    userId: session.user.id
  }
});

// Bad - could leak other users' data
const habits = await prisma.habit.findMany();
```

### Email Not Unique

Email is **no longer unique** in the database. Users can exist with:
- Same email from different providers
- No email (some GitHub accounts)

Always use the `(provider, providerAccountId)` composite key for user lookups in the backend.

### Provider Account ID Stability

- **Google**: Stable across all Google products, won't change
- **GitHub**: Stable for the lifetime of the GitHub account

Both are suitable for permanent user identification.

## Environment Variables

### Required for Authentication

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# GitHub OAuth
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret

# Auth secret
AUTH_SECRET=your_random_secret

# Internal API secret (for sync endpoint)
INTERNAL_SECRET=your_internal_secret

# Database connection
DATABASE_URL=postgresql://postgres:153288@localhost:5432/habit_quest

# API URL (frontend to backend communication)
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Troubleshooting

### User Record Not Created

1. Check browser console for errors during sign-in
2. Check `/internal/users/sync` response in Network tab
3. Verify `INTERNAL_SECRET` matches between `.env` files
4. Check backend logs: `npm run dev -w apps/api`

### Email Field is NULL

This is expected for GitHub users who don't make their email public. The user is still created with:
- `provider` = "github"
- `providerAccountId` = their stable GitHub user ID
- `name` and `image` from their profile

### Multiple Users with Same Email

This can happen when a user signs in with both Google and GitHub using the same email address:

```sql
SELECT provider, "providerAccountId", email FROM "User" 
WHERE email = 'user@example.com';
```

Each will have a different `(provider, providerAccountId)` pair.

## See Also

- [CLAUDE.md](./.claude/CLAUDE.md) - Project authentication requirements
- [TECH_SPEC.md](./.claude/TECH_SPEC.md) - Technical specification
- [Prisma Schema](./apps/api/prisma/schema.prisma) - Database model definitions
