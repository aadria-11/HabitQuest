# HabitQuest Test Execution Guide

**Last Updated:** 2026-09-15
**Status:** Ready to Execute

---

## Quick Start

### Prerequisites
```bash
# Verify Node.js version >= 20.0.0
node --version

# From project root, install dependencies
npm install
```

### Environment Setup

#### 1. Create `.env` files

**`apps/api/.env`**
```env
DATABASE_URL=file:./dev.db
AUTH_SECRET=test-secret-key-min-32-chars-long-for-testing!
INTERNAL_SECRET=test-internal-secret-key
NODE_ENV=test
```

**`apps/web/.env.local`**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
AUTH_SECRET=test-secret-key-min-32-chars-long-for-testing!
INTERNAL_SECRET=test-internal-secret-key
NEXTAUTH_SECRET=test-secret-key-min-32-chars-long-for-testing!
```

#### 2. Initialize Database
```bash
# From project root
npm run db:push -w apps/api    # Create/sync schema
npm run db:seed -w apps/api    # Optional: populate test data
```

---

## Test Execution

### Option A: Run All Tests (Sequential)

```bash
# From project root - runs all test suites
npm test

# Expected output:
# ✓ apps/api: Vitest tests (auth, habits, checkins, websocket)
# ✓ apps/web: Vitest component tests
# ✓ e2e: Playwright E2E tests
```

### Option B: Run by Category

#### **API Unit & Integration Tests**
```bash
npm run test -w apps/api

# With watch mode (re-run on file change)
npm run test -- --watch -w apps/api

# With coverage report
npm run test -- --coverage -w apps/api
```

**Test Files:**
- `apps/api/src/routes/auth.integration.test.ts` - Auth/SSO tests
- `apps/api/src/routes/habits.integration.test.ts` - Habit CRUD tests
- `apps/api/src/routes/checkins.integration.test.ts` - Check-in tests
- `apps/api/src/services/websocket.test.ts` - WebSocket milestone tests
- `apps/api/src/services/habit.service.test.ts` - Service unit tests
- `apps/api/src/services/checkin.service.test.ts` - Service unit tests
- `apps/api/src/services/streak.service.test.ts` - Streak unit tests

#### **Web Component Tests**
```bash
npm run test -w apps/web

# With UI dashboard
npm run test:ui -w apps/web

# Specific test file
npm run test -- components/__tests__/HabitForm.test.tsx -w apps/web
```

**Test Files:**
- `apps/web/components/__tests__/HabitForm.test.tsx` - Habit form validation
- `apps/web/components/__tests__/ErrorState.test.tsx` - Error display

#### **E2E Tests (Playwright)**
```bash
# Run all E2E tests (starts both servers automatically)
npm run test:e2e

# Run with headed browser (see browser window)
npm run test:e2e -- --headed

# Run specific test file
npm run test:e2e -- tests/auth.e2e.test.ts

# Run in debug mode (step through tests)
npm run test:e2e -- --debug

# Generate HTML report
npm run test:e2e
# Report at: ./e2e/results/index.html
```

**Test Files:**
- `e2e/tests/auth.e2e.test.ts` - SSO login flows
- `e2e/tests/habits.e2e.test.ts` - Habit management flows

---

## Manual Test (Development Mode)

If you prefer to manually test the app:

### Terminal 1: Start API
```bash
npm run dev -w apps/api
# Output: Server running at http://localhost:3001
```

### Terminal 2: Start Web
```bash
npm run dev -w apps/web
# Output: ▲ Next.js available at http://localhost:3000
```

### Terminal 3: Monitor Logs
```bash
# Optional: watch database changes
npm run db:migrate -w apps/api

# Or view specific service logs
tail -f apps/api/logs/*.log
```

### Test Coverage in Browser
1. Open http://localhost:3000
2. Click "Sign In" → Select Google/GitHub (mocked in test mode)
3. Create a habit
4. Create today's check-in
5. Verify WebSocket notifications (console)
6. Test error states (disable network, etc.)

---

## Continuous Integration (CI)

The project includes CI-ready test configuration:

```bash
# Run tests as CI would (no watch, with retries)
CI=true npm test

# Generate all coverage reports
npm run test -- --coverage

# Type checking
npm run typecheck

# Linting
npm run lint
```

---

## Test Results Interpretation

### Passing Test Output
```
✓ apps/api » routes/auth.integration.test.ts (5 tests)
  ✓ Google SSO login with valid profile returns JWT token
  ✓ GitHub SSO login with valid profile returns JWT token
  ✓ JWT token contains correct userId, email, and expiration
  ✓ Unauthenticated requests to protected routes return 401
  ✓ Missing Authorization header returns 401

Test Files  4 passed (4)
     Tests  47 passed (47)
```

### Failing Test Output
```
✗ apps/api » routes/habits.integration.test.ts (1 failed)
  ✗ User cannot fetch another user's habit (403 vs 404)
    Error: expected 403 or 404, got 500
    at auth-002/user-isolation
```

**Common Issues:**
- `ECONNREFUSED` - API not running (start with `npm run dev -w apps/api`)
- `DATABASE_ERROR` - Run `npm run db:push -w apps/api`
- `401 Unauthorized` - Check `.env` AUTH_SECRET matches
- `TIMEOUT` - Check both servers are running

---

## Test Case Mapping

Each test file is organized by feature and ID:

| Feature | Test ID | File | Command |
|---------|---------|------|---------|
| SSO Login | auth-001 | auth.integration.test.ts | `npm run test -w apps/api` |
| Create Habit | habit-001 | habits.integration.test.ts | `npm run test -w apps/api` |
| Create Check-in | checkin-001 | checkins.integration.test.ts | `npm run test -w apps/api` |
| Prevent Duplicate | checkin-002 | checkins.integration.test.ts | `npm run test -w apps/api` |
| Authorization | auth-002 | habits.integration.test.ts | `npm run test -w apps/api` |
| WebSocket | websocket-001 | websocket.test.ts | `npm run test -w apps/api` |
| UI Errors | ui-error-001 | ErrorState.test.tsx | `npm run test -w apps/web` |
| Error Handling | error-002 | checkins.integration.test.ts | `npm run test -w apps/api` |

---

## Debugging Tests

### Enable Verbose Output
```bash
npm run test -- --reporter=verbose -w apps/api
```

### Debug Single Test
```bash
# VS Code debugger
node --inspect-brk ./node_modules/vitest/vitest.mjs -w apps/api

# Then open chrome://inspect
```

### Print Debug Logs
```bash
# In test file
import { describe, it, expect, beforeEach } from 'vitest';

it('test with logging', async () => {
  console.log('Debug:', { userId, habitId });
  expect(result).toBe(expected);
});

# Run with:
npm run test -w apps/api -- --reporter=verbose
```

### Database Inspection
```bash
# Open SQLite database in browser
# Install: npx prisma studio
npm run db:studio -w apps/api

# Or inspect raw file
# cat apps/api/dev.db
```

---

## Performance Benchmarks

**Expected Test Execution Times:**

| Suite | Time | Tests |
|-------|------|-------|
| API Unit Tests | ~2s | 15 |
| API Integration Tests | ~8s | 32 |
| Web Component Tests | ~3s | 10 |
| E2E Tests | ~15s | 20 |
| **Total** | **~30s** | **77** |

---

## Test Coverage Goals

**Target Coverage by Module:**

```
apps/api/
  ├── routes/ (integration tests) ........... 85%
  ├── services/ (unit tests) ............... 90%
  ├── controllers/ (integration tests) ..... 80%
  └── middleware/ (unit tests) ............ 95%

apps/web/
  ├── components/ (component tests) ....... 75%
  ├── lib/ (utility tests) ............... 85%
  └── app/ (E2E tests) ................... 70%
```

Generate coverage:
```bash
npm run test -- --coverage -w apps/api
npm run test -- --coverage -w apps/web
```

---

## Troubleshooting

### Tests Won't Run
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Ensure correct Node version
nvm use 20
```

### Database Locked
```bash
# Reset test database
rm apps/api/dev.db
npm run db:push -w apps/api
```

### Port Already in Use
```bash
# Kill process on port 3000/3001
# macOS/Linux:
lsof -ti:3000 | xargs kill -9

# Windows (PowerShell):
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
```

### API Connection Errors
```bash
# Verify API is running
curl http://localhost:3001/health

# Check logs
npm run dev -w apps/api 2>&1 | tee api.log
```

---

## Next Steps

After running all tests:

1. ✓ Verify all 77 tests pass
2. ✓ Review test results in `test_results/TEST_RESULTS.md`
3. ✓ Check coverage reports
4. ✓ File any bugs found during E2E tests
5. → Merge to production once all tests pass

---

## Additional Resources

- **Test Specification:** `test_results/TEST_SPECIFICATION.md`
- **Vitest Docs:** https://vitest.dev
- **Playwright Docs:** https://playwright.dev
- **React Testing Library:** https://testing-library.com/react
- **Supertest:** https://github.com/visionmedia/supertest
