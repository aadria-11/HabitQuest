# Local Development Setup

Since Docker isn't available in this environment, follow these steps to run the app locally:

## Prerequisites

- **Node.js 20+** (already installed ✓)
- **PostgreSQL 14+** (needs to be installed)

## Step 1: Install & Start PostgreSQL

### Windows

1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Run the installer
3. Remember the password you set for the `postgres` user
4. During installation, make sure to check "pgAdmin 4" (useful GUI)
5. After installation, open Command Prompt or PowerShell and verify:
   ```bash
   psql --version
   ```

### macOS

```bash
brew install postgresql@16
brew services start postgresql@16
```

### Linux (Ubuntu/Debian)

```bash
sudo apt-get update
sudo apt-get install postgresql-16
sudo systemctl start postgresql
```

## Step 2: Create Database

Open a terminal and connect to PostgreSQL:

```bash
# Windows/macOS/Linux
psql -U postgres -c "CREATE DATABASE habit_tracker;"
```

When prompted for password, enter the one you set during installation.

## Step 3: Configure Environment

Copy `.env.local` in the repo root to `.env` for the API:

```bash
cp .env.local apps/api/.env
```

Edit the following in `apps/api/.env`:

```
# If you set a different password during PostgreSQL install:
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/habit_tracker"

# Generate random 32+ char strings for secrets:
AUTH_SECRET="$(openssl rand -base64 32)"
INTERNAL_SECRET="$(openssl rand -base64 32)"

# For Entra ID, you'll need to:
# 1. Go to https://portal.azure.com
# 2. Create an app registration in Azure AD
# 3. Copy the Client ID and generate a Client Secret
# 4. Set Redirect URI to http://localhost:3000/auth/callback/azure-ad
ENTRA_ID_CLIENT_ID="your-client-id-from-azure-ad"
ENTRA_ID_CLIENT_SECRET="your-client-secret-from-azure-ad"
ENTRA_ID_TENANT="common"
```

For the frontend, create `apps/web/.env.local`:

```
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_WS_URL="ws://localhost:3001"
```

## Step 4: Initialize Database Schema

```bash
npm run db:push
```

This runs Prisma migrations and creates all tables (User, Habit, HabitCheckIn).

## Step 5: Start the Dev Servers

In separate terminal windows:

**Terminal 1: Start the backend (API server)**

```bash
npm run dev -w apps/api
```

You should see: `API server running on port 3001`

**Terminal 2: Start the frontend (Next.js app)**

```bash
npm run dev -w apps/web
```

You should see: `Ready in XsXXXms`

## Step 6: Open the App

1. Open your browser to http://localhost:3000
2. Click "Sign in with Microsoft"
3. Sign in with your Microsoft/Entra ID account
4. Start creating habits!

---

## Troubleshooting

### "PostgreSQL connection refused"

- Check PostgreSQL is running:
  - **Windows:** Look for "postgres" in Services (services.msc)
  - **macOS:** `brew services list`
  - **Linux:** `sudo systemctl status postgresql`
- Make sure the DATABASE_URL is correct

### "Database does not exist"

Run:
```bash
psql -U postgres -c "CREATE DATABASE habit_tracker;"
```

### "Port 3000 or 3001 already in use"

Change the port in the respective `.env` file and `package.json` script.

### "Auth.js errors about missing secrets"

Ensure `NEXTAUTH_SECRET` and `AUTH_SECRET` are set in the `.env` files.

### "Entra ID redirect URI mismatch"

The callback URL must match exactly. In Azure Portal:
- Go to your app registration
- Settings → Redirect URIs
- Add `http://localhost:3000/auth/callback/azure-ad`

---

## Useful Commands

```bash
# Run tests
npm run test

# Type checking
npm run typecheck

# Linting
npm run lint

# Open Prisma Studio (GUI for database)
npm run db:studio -w apps/api

# View API health
curl http://localhost:3001/health
```

## Environment File Reference

See `.env.example` in the repo root for all available variables.

