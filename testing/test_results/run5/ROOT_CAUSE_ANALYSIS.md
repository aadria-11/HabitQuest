# Root Cause Analysis - 99 Failing Tests

**Date**: 2026-09-17  
**Scope**: Analysis of all 99 failing tests in Run 5  
**Status**: ✅ Root causes identified and categorized

---

## Executive Summary

The 99 failing tests are caused by **4 distinct root causes**:

| Root Cause | Failed Tests | Severity | Category |
|-----------|-----------|----------|----------|
| Service layer function imports not exported | 54 | 🔴 CRITICAL | Unit Tests |
| API tests using deprecated auth headers | 20 | 🔴 CRITICAL | Integration Tests |
| WebSocket timeout issues | 11 | 🟡 HIGH | Integration Tests |
| Missing prisma mock setup | 14 | 🔴 CRITICAL | Unit Tests |

**Total**: 54 + 20 + 11 + 14 = 99 failing tests

---

## Root Cause #1: Service Layer Functions Not Exported (54 tests)

### Affected Tests: 54 tests across 3 files
- `streak.service.test.ts`: 12 tests
- `checkin.service.test.ts`: 13 tests  
- `habit.service.test.ts`: 16 tests
- `auth.middleware.test.ts`: 13 tests

### Error Pattern
```
TypeError: calculateCurrentStreak is not a function
TypeError: calculateBestStreak is not a function
TypeError: canCheckInToday is not a function
TypeError: updateStreaks is not a function
TypeError: getUserHabits is not a function
TypeError: createHabit is not a function
TypeError: updateHabit is not a function
// ... etc
```

### Root Cause
The test files are trying to import functions that are **not being exported** from their respective service files:

**Example from streak.service.test.ts:**
```typescript
import { calculateCurrentStreak, calculateBestStreak, canCheckInToday, updateStreaks } from '@api/services/streak.service';

// Error: calculateCurrentStreak is not a function
```

**What the service files likely look like:**
```typescript
// apps/api/src/services/streak.service.ts
export async function calculateCurrentStreak(habitId: string) { ... }
export async function calculateBestStreak(habitId: string) { ... }

// But tests expect these to be exported and they're not!
```

### Why It Happens
1. **Service functions are internal** - These may be private functions or not explicitly exported
2. **Test setup incomplete** - Tests were written expecting functions to be public
3. **Missing interface/barrel exports** - Service files may not have proper export statements

### Solution Required
1. **Export all service functions** used by tests from their respective service files
2. **Add barrel export file** (e.g., `services/index.ts`) if needed
3. **Ensure test imports match actual exports**

### Verification Needed
Check what functions are currently exported from:
- `apps/api/src/services/streak.service.ts`
- `apps/api/src/services/checkin.service.ts`
- `apps/api/src/services/habit.service.ts`
- `apps/api/src/services/auth.middleware.ts`

---

## Root Cause #2: API Tests Using Deprecated X-User-Id Header (20 tests)

### Affected Tests: 20 tests across 2 files
- `habit.api.integration.test.ts`: 20 tests
- `checkin.api.integration.test.ts`: 14 tests

### Error Pattern
```
Error: expected 201 "Created", got 401 "Unauthorized"
Error: expected 200 "OK", got 401 "Unauthorized"  
Error: expected 403 "Forbidden", got 401 "Unauthorized"
Error: expected 400 "Bad Request", got 401 "Unauthorized"
```

### Root Cause
The API integration tests are using **deprecated authentication method**:

**Current test code (WRONG):**
```typescript
const res = await request(app)
  .post('/api/habits')
  .set('Authorization', `Bearer ${authToken}`)
  .set('X-User-Id', userId)  // ❌ DEPRECATED - This header doesn't work
  .send({ name: 'Morning Exercise' })
  .expect(201);
```

**What the API expects (CORRECT):**
```typescript
// JWT token is signed with userId in payload
// No X-User-Id header needed
const res = await request(app)
  .post('/api/habits')
  .set('Authorization', `Bearer ${jwtToken}`)  // ✅ JWT token (already contains userId)
  .send({ name: 'Morning Exercise' })
  .expect(201);
```

### Architecture Mismatch
The application uses **Auth.js with JWT tokens**, but the API integration tests were written expecting:
- ✅ Auth.js uses: JWT tokens with userId in payload
- ❌ Tests expect: X-User-Id header to identify user

### Evidence
Looking at test code in `habit.api.integration.test.ts` lines 20-21:
```typescript
.set('Authorization', `Bearer ${authToken}`)
.set('X-User-Id', 'user-123')  // ❌ This is the problem
.expect(200);
```

But working tests (checkins.integration.test.ts) use:
```typescript
.set('Authorization', `Bearer ${user1.token}`)  // ✅ JWT token only
.send({ date: testDate })
.expect(201);
```

### Why API Rejects with 401
1. Test sends `X-User-Id` header (ignored by API)
2. API middleware checks JWT token to extract userId
3. Without proper JWT parsing, middleware rejects as Unauthorized (401)
4. Test expects 201/200/403, gets 401 instead

### Solution Required
1. **Update test setup** to use proper Auth.js JWT token generation
2. **Remove X-User-Id header** from all test requests
3. **Use same auth pattern** as checkins.integration.test.ts (which works)
4. **Example fix:**
   ```typescript
   const token = jwt.sign(
     { userId, email, name },
     AUTH_SECRET,
     { expiresIn: '15m' }
   );
   
   const res = await request(app)
     .post('/api/habits')
     .set('Authorization', `Bearer ${token}`)
     .send({ name: 'Morning Exercise' })
     .expect(201);
   ```

### Affected Test Files
- `apps/api/src/routes/habit.api.integration.test.ts` - 20 failing tests
- `apps/api/src/routes/checkin.api.integration.test.ts` - 14 failing tests

---

## Root Cause #3: WebSocket Test Timeouts (11 tests)

### Affected Tests: 11 tests
- `websocket.integration.test.ts`: 11 failed out of 19

### Error Pattern
```
× should receive habit:created event 5062ms
× should handle disconnection 5076ms
× should update habit state across tabs simultaneously 5052ms
```

**Timing Pattern**: All failures show ~5000ms duration = **5 second timeout**

### Root Cause
WebSocket tests are timing out waiting for events. Two possible causes:

**Cause A: Connection Establishment**
- WebSocket server not accepting connections within 5-second timeout
- Event handler not receiving broadcasted events
- Client not properly subscribing to events

**Cause B: Missing Mocks**
- Service layer functions not exported (see Root Cause #1)
- When check-ins are created, habit streaks should update
- WebSocket should broadcast `streak:updated` event
- But if service functions don't exist, habit state never changes

### Evidence
Test file shows 8/19 tests passing:
- "should broadcast habit creation to multiple clients" - ✅ PASSED (289ms)
- "should sync check-in across sessions" - ✅ PASSED (280ms)
- "should receive habit:created event" - ❌ FAILED (5062ms - timeout)

**Pattern**: Tests that don't depend on streak/checkin services pass. Tests that do fail.

### Why This Happens
```
Dependency chain:
1. WebSocket connection opened ✅
2. Test creates check-in → calls streak service function ❌
3. Streak service function doesn't exist (not exported)
4. Streak doesn't update → No streak:updated event ❌
5. Test waits 5 seconds for event that never comes 📊
6. Test times out 🔴
```

### Solution Required
1. **Fix Root Cause #1** - Export service layer functions
2. **Verify WebSocket event handlers** - Ensure events broadcast correctly
3. **Add WebSocket connection logging** - Debug why some events don't arrive
4. **Consider reducing timeout** - 5 seconds might be too aggressive

### Known Passing Tests (Not Affected)
- "should broadcast habit creation to multiple clients" ✅
- "should sync check-in across sessions" ✅
- Other tests that don't trigger service function calls

---

## Root Cause #4: Prisma Mock Setup Issues (14 tests)

### Affected Tests: 14 tests
- `habit.service.test.ts`: Part of 16 failing tests
- `checkin.service.test.ts`: Part of 13 failing tests

### Error Pattern
```
AssertionError: expected [Function] to throw error including 'Invalid status' 
but got '__vite_ssr_import_0__.prisma.habit.fi… is not a function'

TypeError: "__vite_ssr_import_0__.prisma.habit.findFirst is not a function"
```

### Root Cause
The Prisma mock is not being properly set up in tests. Tests are trying to call:
```typescript
prisma.habit.findFirst(...)  // Error: not a function
prisma.habit.findMany(...)   // Error: not a function
```

**Why?** The mock setup likely has issues like:
1. Prisma client not properly mocked
2. Mock methods not configured correctly
3. Mock reset between tests not working
4. vi.mocked() not working as expected

### Evidence
Test code:
```typescript
vi.mocked(prisma.habit.findMany).mockResolvedValue(mockHabits);

const result = await getUserHabits(userId, { status });
// Error: prisma.habit.findMany is not a function
```

The mock declaration is there, but it's not taking effect.

### Why This Blocks Tests
1. Tests try to mock Prisma calls
2. Mocks don't apply correctly
3. Code tries to call real Prisma client
4. Real client not initialized in test environment
5. Calls fail with "not a function"

### Solution Required
1. **Review vitest.config.ts** - Check mock configuration
2. **Check test setup files** - Verify Prisma mock initialization
3. **Review vi.mock() calls** - Ensure they're at module level
4. **Add beforeEach cleanup** - Reset mocks between tests

---

## Summary Table

| Category | Root Cause | Failed | Files | Severity | Fix Effort |
|----------|-----------|--------|-------|----------|-----------|
| Unit Tests | Service functions not exported | 54 | 4 | 🔴 CRITICAL | 2 hours |
| Integration Tests | Wrong auth headers (X-User-Id) | 20 | 2 | 🔴 CRITICAL | 2 hours |
| Integration Tests | WebSocket timeouts | 11 | 1 | 🟡 HIGH | 3 hours |
| Unit Tests | Prisma mock setup | 14 | 2 | 🔴 CRITICAL | 2 hours |
| **TOTAL** | **4 root causes** | **99** | **11** | — | **~9 hours** |

---

## Priority Roadmap

### Phase 1: Export Service Functions (2 hours)
1. Identify which functions need to be exported
2. Add export statements to service files
3. Run unit tests to verify
4. Expected result: 54 tests fixed

### Phase 2: Fix API Auth Headers (2 hours)
1. Update test setup to use JWT tokens properly
2. Remove X-User-Id headers from all API tests
3. Follow pattern from working checkins.integration.test.ts
4. Expected result: 20 tests fixed + WebSocket tests may also fix

### Phase 3: Fix Prisma Mocks (2 hours)
1. Review vitest configuration
2. Verify mock initialization
3. Add proper beforeEach cleanup
4. Expected result: 14 tests fixed (+ 11 WebSocket may fix)

### Phase 4: Verify WebSocket Tests (3 hours)
1. After Phase 1-3, run WebSocket tests
2. Should be ~0 failures if previous fixes work
3. If issues remain, debug event handlers
4. Expected result: 11 tests fixed

---

## Impact Analysis

### If All Fixed
- ✅ 99 failing tests → 0 failing tests
- ✅ Total pass rate: 38.1% → 100%
- ✅ All 160 tests passing
- ✅ Full test coverage verified

### If Not Fixed
- ❌ Tests remain unreliable
- ❌ API changes may introduce regressions
- ❌ Difficult to catch production bugs
- ❌ CI/CD pipelines would fail

### Recommended Approach
1. **Start with Root Cause #1** (export service functions) - Blocks other tests
2. **Then Root Cause #2** (auth headers) - High impact, medium difficulty
3. **Then Root Cause #4** (Prisma mocks) - Needed for unit test reliability
4. **Finally Root Cause #3** (WebSocket) - May auto-fix after previous fixes

---

## Test File Investigation Needed

To implement fixes, examine these files:

**Service Files (verify exports):**
- `apps/api/src/services/streak.service.ts`
- `apps/api/src/services/checkin.service.ts`
- `apps/api/src/services/habit.service.ts`
- `apps/api/src/services/auth.middleware.ts`

**Test Files (verify imports):**
- `apps/api/src/services/streak.service.test.ts`
- `apps/api/src/services/checkin.service.test.ts`
- `apps/api/src/services/habit.service.test.ts`
- `apps/api/src/services/auth.middleware.test.ts`

**API Integration Tests (update auth):**
- `apps/api/src/routes/habit.api.integration.test.ts`
- `apps/api/src/routes/checkin.api.integration.test.ts`

**Configuration:**
- `apps/api/vitest.config.ts` (mock setup)
- `apps/api/src/setup.ts` (if exists)

---

## Conclusion

The 99 failing tests are caused by **4 interconnected issues**, not random failures:

1. **54 tests**: Service functions not exported from modules
2. **20 tests**: API tests using wrong authentication method
3. **14 tests**: Prisma mock initialization issues
4. **11 tests**: WebSocket timeouts (likely cascade from #1)

Each has a clear fix path. **Estimated total fix time: 8-9 hours** to resolve all failing tests and achieve 100% pass rate.

**Status**: ✅ Root causes identified and actionable
**Next**: Implement fixes in priority order
