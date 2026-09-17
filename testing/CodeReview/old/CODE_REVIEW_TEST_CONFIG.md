# Code Review - Test Configuration Issues

**Date:** 2026-09-15  
**Review Scope:** Test setup and vitest configuration  
**Status:** 🔴 **ISSUE FOUND - Blocking**

---

## Critical Finding: Missing vitest Configuration for React Tests

### Issue Description

The `apps/web/package.json` adds a test script (`"test": "vitest"`) but the vitest environment is not properly configured for React Testing Library.

**Current State:**
```json
{
  "scripts": {
    "test": "vitest"
  },
  "devDependencies": {
    "vitest": "^1.x.x"
    // ❌ Missing: jsdom or happy-dom
    // ❌ Missing: vitest.config.ts
  }
}
```

**What Will Happen:**
When you run `npm test`, vitest will default to Node environment, and React component tests will fail with:
```
ReferenceError: document is not defined
```

---

## Root Cause Analysis

### 1. Missing DOM Environment Setup
React Testing Library requires a DOM environment to render components. Without it:
- The `render()` function fails
- DOM APIs like `document`, `window`, `querySelector` are undefined
- jsdom or happy-dom must be installed and configured

### 2. No vitest Configuration File
No `vitest.config.ts` or `vitest.config.js` exists to:
- Specify the test environment (`jsdom` or `happy-dom`)
- Configure path aliases (`@/*`, `@shared/*`)
- Set up test globals
- Configure test reporters

### 3. Missing Test Dependencies
The test setup requires:
- `jsdom` or `happy-dom` - provides DOM API in Node environment
- `@testing-library/react` - already present ✅
- `@testing-library/jest-dom` - already present ✅
- `vitest` - already present ✅

---

## Impact Assessment

### Test Files Affected
All React component tests in `apps/web/components/__tests__/` will fail:
- HabitForm.test.tsx
- ErrorState.test.tsx  
- LoadingState.test.tsx
- StreakBadge.test.tsx
- BestStreak.test.tsx
- TotalCheckIns.test.tsx
- And others...

### Failure Scenario
```bash
$ npm test

 ✗ components/__tests__/HabitForm.test.tsx
   ReferenceError: document is not defined
     at render() in testing-library
```

---

## Solution

### Step 1: Install DOM Environment Package
Choose one of:

**Option A: jsdom (recommended)**
```bash
npm install --save-dev jsdom
```

**Option B: happy-dom (lighter weight)**
```bash
npm install --save-dev happy-dom
```

### Step 2: Create vitest Configuration
Create `apps/web/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom', // or 'happy-dom'
    globals: true,
    setupFiles: ['./vitest.setup.ts'], // optional
    include: ['**/__tests__/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@shared': path.resolve(__dirname, '../../packages/shared'),
    },
  },
});
```

### Step 3: Optional - Create Setup File
Create `apps/web/vitest.setup.ts`:

```typescript
import '@testing-library/jest-dom';

// Mock environment variables if needed
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001';
```

### Step 4: Verify
```bash
cd apps/web
npm test
```

---

## Configuration Checklist

- [ ] Install `jsdom` or `happy-dom` as devDependency
- [ ] Create `vitest.config.ts` in apps/web
- [ ] Configure environment to 'jsdom' or 'happy-dom'
- [ ] Configure path aliases (@/, @shared/)
- [ ] Configure globals: true for describe/it/expect
- [ ] Create vitest.setup.ts if needed
- [ ] Run tests to verify they work
- [ ] Update CI/CD to run tests

---

## Additional Recommendations

### 1. Add to package.json
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run", // CI mode
    "test:coverage": "vitest run --coverage"
  }
}
```

### 2. Add vitest Plugin
```bash
npm install --save-dev @vitejs/plugin-react
```

### 3. Update tsconfig.json
Ensure test files are included:
```json
{
  "compilerOptions": {
    "types": ["vitest/globals"]
  },
  "include": ["src/**/*", "app/**/*", "components/**/*", "**/*.test.ts", "**/*.test.tsx"]
}
```

---

## Priority & Timeline

| Item | Priority | Effort | Timeline |
|------|----------|--------|----------|
| Install jsdom | 🔴 HIGH | 2 min | Immediate |
| Create vitest.config.ts | 🔴 HIGH | 10 min | Immediate |
| Test suite verification | 🟡 MEDIUM | 15 min | Today |
| CI/CD integration | 🟡 MEDIUM | 30 min | This sprint |

---

## Testing After Fix

Once configured, verify:

```bash
# Run tests in watch mode
npm test

# Run tests once (for CI)
npm test -- --run

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- HabitForm.test.tsx
```

---

## Related Files

- **[CODE_REVIEW.md](./CODE_REVIEW.md)** - Full code review
- **[CODE_REVIEW_FINDINGS.md](./CODE_REVIEW_FINDINGS.md)** - All findings by priority

---

## Summary

**Status:** 🔴 **BLOCKING**  
**Severity:** HIGH  
**Fix Complexity:** LOW  
**Estimated Fix Time:** 20 minutes

The test setup is incomplete but straightforward to fix. Once configured, the test suite will run properly with React component tests supported.

**Recommendation:** Fix this before committing the test script changes or before running CI/CD.
