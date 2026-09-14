# Common Database Queries

Quick reference for viewing and querying HabitQuest data.

## Connection String

```
postgresql://postgres:153288@localhost:5432/habit_quest
```

## User Queries

### View All Users

```sql
SELECT id, provider, "providerAccountId", email, name, image, "createdAt" 
FROM "User"
ORDER BY "createdAt" DESC;
```

### View Users by Provider

```sql
-- Google users
SELECT id, "providerAccountId", email, name 
FROM "User" 
WHERE provider = 'google';

-- GitHub users
SELECT id, "providerAccountId", email, name 
FROM "User" 
WHERE provider = 'github';
```

### Find User by Email

```sql
SELECT id, provider, "providerAccountId", email, name 
FROM "User" 
WHERE email = 'user@example.com';
```

### Find User by Provider ID

```sql
SELECT * FROM "User" 
WHERE provider = 'github' AND "providerAccountId" = '12345678';
```

### View Users Without Email

```sql
SELECT id, provider, "providerAccountId", name, image 
FROM "User" 
WHERE email IS NULL;
```

### Count Users by Provider

```sql
SELECT provider, COUNT(*) as count 
FROM "User" 
GROUP BY provider;
```

## Habit Queries

### View All Habits

```sql
SELECT h.id, h.name, h.status, h."currentStreak", h."bestStreak", 
       u.email as user_email
FROM "Habit" h
JOIN "User" u ON h."userId" = u.id
ORDER BY h."createdAt" DESC;
```

### View User's Habits

```sql
SELECT h.id, h.name, h.description, h.status, h."currentStreak", h."bestStreak"
FROM "Habit" h
WHERE h."userId" = 'clx9k2v5f0000qz3g7x4q3x3g'
ORDER BY h."createdAt" DESC;
```

### View Active Habits Only

```sql
SELECT h.id, h.name, h."currentStreak", h."bestStreak"
FROM "Habit" h
WHERE h.status = 'ACTIVE'
ORDER BY h."currentStreak" DESC;
```

### View Habits by Status

```sql
SELECT status, COUNT(*) as count
FROM "Habit"
GROUP BY status;
```

## Check-In Queries

### View Check-ins for a Habit

```sql
SELECT h.id, h."checkInDate"
FROM "HabitCheckIn" h
WHERE h."habitId" = 'clx9k2v5f0000qz3g7x4q3x3a'
ORDER BY h."checkInDate" DESC;
```

### Check-ins in Last 7 Days

```sql
SELECT h.id, h."checkInDate", h.habit."name"
FROM "HabitCheckIn" h
WHERE h."checkInDate" >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY h."checkInDate" DESC;
```

### User's Check-in History

```sql
SELECT ci."checkInDate", hb.name, hb."currentStreak"
FROM "HabitCheckIn" ci
JOIN "Habit" hb ON ci."habitId" = hb.id
WHERE hb."userId" = 'clx9k2v5f0000qz3g7x4q3x3g'
ORDER BY ci."checkInDate" DESC;
```

## Milestone Notification Queries

### View Unacknowledged Milestones

```sql
SELECT mn.id, mn.milestone, h.name, u.email, mn."createdAt"
FROM "MilestoneNotification" mn
JOIN "Habit" h ON mn."habitId" = h.id
JOIN "User" u ON mn."userId" = u.id
WHERE mn.acknowledged = false
ORDER BY mn."createdAt" DESC;
```

### View User's Milestones

```sql
SELECT mn.milestone, h.name, mn."createdAt", mn.acknowledged
FROM "MilestoneNotification" mn
JOIN "Habit" h ON mn."habitId" = h.id
WHERE mn."userId" = 'clx9k2v5f0000qz3g7x4q3x3g'
ORDER BY mn."createdAt" DESC;
```

## Data Cleanup

### Delete All Data for a User

```sql
-- Caution: This deletes all user's habits, check-ins, and notifications
DELETE FROM "User" WHERE id = 'clx9k2v5f0000qz3g7x4q3x3g';
-- (Cascading deletes handle related records)
```

### Delete a Specific Habit and Related Data

```sql
DELETE FROM "Habit" WHERE id = 'clx9k2v5f0000qz3g7x4q3x3a';
-- (Cascading deletes handle check-ins and notifications)
```

### Clear All Test Data

```sql
TRUNCATE TABLE "MilestoneNotification";
TRUNCATE TABLE "HabitCheckIn";
TRUNCATE TABLE "Habit";
TRUNCATE TABLE "User";
```

## Viewing with Prisma Studio

```bash
# From repository root
npm run -w apps/api -- npx prisma studio
```

Opens web UI at: `http://localhost:5555`

**Features:**
- Browse tables visually
- Create/edit/delete records
- Filter data
- View relationships
- No SQL needed

## Using psql

```bash
# Connect to database
psql postgresql://postgres:153288@localhost:5432/habit_quest

# Common psql commands
\dt              # List all tables
\d "User"        # Describe User table structure
\d "Habit"       # Describe Habit table structure
\l               # List all databases
\q               # Quit

# Run SQL file
\i /path/to/query.sql

# Export query results to CSV
\copy (SELECT * FROM "User") TO 'users.csv' CSV HEADER;
```

## Useful Indexes

For performance analysis:

```sql
-- Check index usage
SELECT indexname, idx_scan 
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;

-- User identity lookup (uses composite unique constraint)
-- Provider + ProviderAccountId lookup is indexed

-- Habit queries by user
-- Already indexed: (userId, status)

-- Check-in queries
-- Already indexed: habitId
```

## Database Schema

```sql
-- View current schema
\d+
```

## Performance Tips

1. **Always filter by userId for Habits**
   - Uses the `(userId, status)` composite index

2. **Avoid email lookups**
   - Email is not unique (same user can exist with multiple providers)
   - Use `(provider, providerAccountId)` for user lookups

3. **Batch operations**
   - Use `EXPLAIN ANALYZE` to check query performance
   - Prisma's batch operations are efficient

## Troubleshooting

### Connection Issues

```bash
# Test connection
psql postgresql://postgres:153288@localhost:5432/habit_quest -c "SELECT 1;"

# If connection refused
# 1. Verify PostgreSQL is running
# 2. Check .env file for correct DATABASE_URL
# 3. Verify credentials in connection string
```

### Check Schema Version

```sql
SELECT version, name 
FROM "_prisma_migrations" 
ORDER BY finished_at DESC;
```

### See All Migrations Applied

```sql
SELECT * FROM "_prisma_migrations";
```
