# Test Configuration Guide

This document outlines the configuration needed to run the HabitQuest test suite.

## Prerequisites

Ensure the following are installed:
- Node.js >= 20.0.0
- npm >= 10.0.0
- Git

## Dependencies

### Already Installed (from package.json)
```json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "supertest": "^6.3.0",
    "socket.io": "^4.5.0",
    "socket.io-client": "^4.5.0"
  }
}
```

### Need to Verify/Install
```bash
npm install
```

## Test Environment Setup

### 1. Vitest Configuration

The root project should have `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./testing/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'testing/test_case/',
      ]
    }
  }
});
```

### 2. Backend Vitest Config

Located at: `apps/api/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  }
});
```

### 3. Frontend Vitest Config

Located at: `apps/web/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test-setup.ts'],
  }
});
```

## Environment Variables

### .env.test (Backend)
```
DATABASE_URL=postgres://user:password@localhost:5432/habitquest_test
NODE_ENV=test
API_PORT=3001
JWT_SECRET=test-secret-key
```

### .env.test.local (Frontend)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_ENV=test
```

## Database Setup for Integration Tests

### 1. Create Test Database
```bash
npm run db:create:test
```

### 2. Run Migrations
```bash
npm run db:migrate -- --env test
```

### 3. Seed Test Data
```bash
npm run db:seed -- --env test
```

### 4. Reset After Tests
```bash
npm run db:reset -- --env test
```

## Test Database Configuration

### Database Isolation Pattern

Each test suite should:
1. Create isolated test records
2. Use unique user IDs (e.g., `user-test-${Date.now()}`)
3. Clean up after itself using `afterEach` hooks
4. Avoid shared test data dependencies

Example:
```typescript
describe('Habit Tests', () => {
  let testUserId: string;

  beforeEach(async () => {
    testUserId = `user-test-${Date.now()}`;
    // Create test user
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.habit.deleteMany({
      where: { userId: testUserId }
    });
  });
});
```

## Port Configuration

Tests use these ports (ensure they're free):
- API: `3001` (integration tests)
- WebSocket: `3001` (WebSocket tests)
- Database: `5432` (PostgreSQL)

### Conflict Resolution
If ports are in use, modify test config:

```typescript
const API_PORT = process.env.TEST_API_PORT || 3001;
const WS_PORT = process.env.TEST_WS_PORT || 3002;
```

Then run:
```bash
TEST_API_PORT=3010 npm test
```

## Mock Configuration

### Prisma Mock Setup

File: `testing/mocks/prisma.ts`

```typescript
import { vi } from 'vitest';

export const mockPrisma = {
  habit: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  habitCheckIn: {
    create: vi.fn(),
    findMany: vi.fn(),
    delete: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
};
```

### Session Mock Setup

File: `testing/mocks/session.ts`

```typescript
export const mockSession = {
  user: {
    id: 'user-test-123',
    email: 'test@example.com',
    name: 'Test User',
    image: 'https://example.com/avatar.jpg',
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};
```

## Test Setup Files

### Frontend Setup: `apps/web/test-setup.ts`

```typescript
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: mockSession,
    status: 'authenticated',
  }),
  signOut: vi.fn(),
}));
```

### Backend Setup: `apps/api/test-setup.ts`

```typescript
import { beforeAll, afterAll } from 'vitest';
import { prisma } from './src/lib/prisma';

beforeAll(async () => {
  // Connect to test database
  await prisma.$connect();
});

afterAll(async () => {
  // Disconnect after all tests
  await prisma.$disconnect();
});
```

## CI/CD Integration

### GitHub Actions Configuration

File: `.github/workflows/test.yml`

```yaml
name: Run Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: habitquest_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Setup test database
        run: npm run db:migrate -- --env test

      - name: Run tests
        run: npm test
        env:
          DATABASE_URL: postgres://postgres:postgres@localhost:5432/habitquest_test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

## Debugging Tests

### Run with Debug Output
```bash
npm test -- --reporter=verbose
```

### Run Single Test
```bash
npm test -- habit.service.test.ts
```

### Run Tests Matching Pattern
```bash
npm test -- --grep "should prevent"
```

### Run with Debugger
```bash
node --inspect-brk ./node_modules/.bin/vitest run
```

Then open `chrome://inspect` in Chrome DevTools.

## Performance Optimization

### Parallel Test Execution
```bash
npm test -- --threads
```

### Run Tests Sequentially (if needed)
```bash
npm test -- --no-threads
```

### Skip Slow Tests
```bash
npm test -- --exclude "**/slow/**"
```

### Run Fast Tests Only
```bash
npm test -- --grep "unit"
```

## Coverage Reports

### Generate Coverage
```bash
npm test -- --coverage
```

### View HTML Coverage Report
```bash
open coverage/index.html
```

### Coverage Thresholds
Configure in `vitest.config.ts`:

```typescript
coverage: {
  lines: 80,
  functions: 80,
  branches: 75,
  statements: 80,
}
```

## Common Issues & Fixes

### Issue: "Cannot find module" errors
**Fix**: Ensure path aliases are configured in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@api/*": ["apps/api/src/*"],
      "@web/*": ["apps/web/*"]
    }
  }
}
```

### Issue: Database connection timeout
**Fix**: Increase timeout in test setup:
```typescript
const prisma = new PrismaClient({
  errorFormat: 'pretty',
  log: ['error'],
  // Increase timeout
  __internal: {
    engine: { requestHandler: { timeout: 30000 } }
  }
});
```

### Issue: Port already in use
**Fix**: Kill process using port:
```bash
# macOS/Linux
lsof -i :3001 | awk 'NR>1 {print $2}' | xargs kill -9

# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Issue: Tests hanging
**Fix**: Add timeout configuration:
```typescript
test('my test', async () => {
  // Test code
}, { timeout: 10000 });
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up after tests
3. **Mocking**: Mock external dependencies
4. **Names**: Use descriptive test names
5. **Arrange-Act-Assert**: Follow AAA pattern
6. **Speed**: Keep tests fast (< 100ms each)
7. **Determinism**: Tests should not be flaky

## Resources

- [Vitest Setup Guide](https://vitest.dev/guide/)
- [React Testing Library Setup](https://testing-library.com/react)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)
