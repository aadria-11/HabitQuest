# Run 7 - Root Cause Analysis

---

## Issue #1: Missing Environment Variables

### Severity: 🔴 CRITICAL

### Affected Tests: 40 tests
- Habit API Integration Tests: 24 tests
- Check-In API Integration Tests: 16 tests

### Error Message
```
Invalid environment variables: [
  {
    code: 'invalid_type',
    expected: 'string',
    received: 'undefined',
    path: [ 'DATABASE_URL' ],
    message: 'Required'
  },
  {
    code: 'invalid_type',
    expected: 'string',
    received: 'undefined',
    path: [ 'AUTH_SECRET' ],
    message: 'Required'
  },
  {
    code: 'invalid_type',
    expected: 'string',
    received: 'undefined',
    path: [ 'INTERNAL_SECRET' ],
    message: 'Required'
  }
]
```

### Root Cause
Integration tests require database and authentication credentials, but the `.env` file is not configured in the test environment.

**File**: `src/config/env.ts:22` - `process.exit(1)` is called when env validation fails

### Stack Trace
```
Error: process.exit unexpectedly called with "1" (test file)
 ❯ loadEnv src/config/env.ts:22:13
 ❯ getEnv src/config/env.ts:30:13
 ❯ createApp src/app.ts:12:15
 ❯ src/routes/habit.api.integration.test.ts:13:11
```

### Impact
- ❌ No integration tests can run
- ❌ Database operations cannot be tested
- ❌ API endpoints cannot be validated
- ❌ Authentication cannot be verified in integration context

### Solution
1. Create or update `.env` file in `apps/api/` with test values
2. Or configure environment in test setup
3. Alternatively, make env validation optional in test mode

### Fix Implementation
```bash
# Create .env file for testing
cat > apps/api/.env.test << 'EOF'
DATABASE_URL=postgresql://test:test@localhost:5432/habit-quest-test
AUTH_SECRET=test-auth-secret-key-32-chars-long-12345
INTERNAL_SECRET=test-internal-secret-key-32-chars-long
NODE_ENV=test
EOF
```

---

## Issue #2: Missing Auth Middleware Function Exports

### Severity: 🔴 CRITICAL

### Affected Tests: 13 tests
- Auth Middleware Unit Tests - all 13 tests

### Error Message
```
TypeError: verifyAuthSession is not a function
TypeError: protectedRoute is not a function
```

### Root Cause
Functions are not exported from `src/services/auth.middleware.ts`:
- `verifyAuthSession` - Used to verify session tokens
- `protectedRoute` - Express middleware for protecting routes

**File**: `src/services/auth.middleware.test.ts:23` - Attempting to call undefined function

### Stack Trace Example
```
TypeError: verifyAuthSession is not a function
 ❯ src/services/auth.middleware.test.ts:23:28
     21|       };
     22|
     23|       const result = await verifyAuthSession(mockSession);
     |                            ^
     24|
     25|       expect(result).toEqual(mockSession);
```

### Impact
- ❌ Cannot test auth middleware logic
- ❌ Session verification not testable
- ❌ Route protection not testable
- ❌ OAuth integration cannot be validated

### Affected Test Cases
1. `should verify valid session token` ❌
2. `should reject expired session` ❌
3. `should reject missing user data` ❌
4. `should require user.id` ❌
5. `should allow access with valid session` ❌
6. `should deny access without session` ❌
7. `should deny access with invalid session` ❌
8. `should deny access if user not authenticated` ❌
9. `should support Google OAuth` ❌
10. `should support GitHub OAuth` ❌
11. `should reject password-based authentication` ❌
12. `should not expose session tokens in logs` ❌
13. `should validate session format` ❌

### Solution
Export missing functions from `src/services/auth.middleware.ts`:

```typescript
export async function verifyAuthSession(session: Session): Promise<Session> {
  // Implementation
}

export async function protectedRoute(req: Request): Promise<boolean> {
  // Implementation
}
```

---

## Issue #3: WebSocket Timeout Issues

### Severity: 🔴 CRITICAL

### Affected Tests: 9 tests

### Error Pattern #1: Test Timeout (5000ms)
```
Error: Test timed out in 5000ms.
If this is a long-running test, pass a timeout value as the last argument 
or configure it globally with "testTimeout".
```

**Affected Tests**:
- should handle disconnection (5097ms)
- should receive habit:created event (5075ms)
- should receive habit:updated event (5036ms)
- should receive habit:deleted event (5036ms)
- should receive habit:checkedin event (5045ms)
- should receive streak:updated event (5038ms)
- should update habit state across tabs (5049ms)
- should handle invalid event data (5038ms)
- should handle connection timeout (5045ms)

### Error Pattern #2: Assertion Failures (2 tests)
```
AssertionError: expected false to be true
- Expected: true
- Received: false
```

**Affected Tests**:
- should broadcast habit creation to multiple clients
- should sync check-in across sessions

### Root Cause Analysis

#### Cause A: Test Timeout Too Short
The default Vitest timeout is 5000ms, but WebSocket tests need longer:
- Connection establishment: ~1000ms
- Event emission: ~500ms
- Event reception: ~500ms
- Assertion: ~100ms
- **Total typical time**: ~2000ms
- **Some tests**: >5000ms (race conditions, timing issues)

#### Cause B: Event Emission Not Working
WebSocket events are not being properly emitted or received:
```
// Expected behavior:
server.emit('habit:created', habitData)
client.on('habit:created', handleEvent)

// Actual behavior:
Events not firing within timeout window
```

#### Cause C: Socket.IO Configuration Issues
Possible issues:
- Socket.IO namespace not configured correctly
- Event handlers not attached to correct namespaces
- Client/server socket not properly connected

### Stack Trace
```
Error: Test timed out in 5000ms.
 ❯ src/routes/websocket.integration.test.ts:47:5
     45|     });
     46|
     47|     it('should handle disconnection', async () => {
       |     ^
     48|       clientSocket.disconnect();
```

### Impact
- ⚠️ 47% of WebSocket tests failing
- ❌ Real-time updates not validated
- ❌ Multi-client synchronization not testable
- ❌ Event broadcasting not verified

### Solution Options

**Option A: Increase Test Timeout (Quick Fix)**
```typescript
it('should handle disconnection', async () => {
  // test code
}, 10000); // 10 second timeout
```

**Option B: Configure Global Timeout in vitest.config.ts**
```typescript
export default defineConfig({
  test: {
    testTimeout: 10000, // 10 seconds
  }
});
```

**Option C: Fix WebSocket Event Emission (Proper Fix)**
- Debug why events aren't emitting
- Verify Socket.IO connection is established
- Check event handler registration
- Validate namespace configuration

### Recommended Fix Priority
1. First: Increase timeout to 10000ms (immediate relief)
2. Then: Debug and fix event emission logic
3. Finally: Optimize timing to reduce test duration

---

## Issue #4: Component Rendering Issues

### Severity: 🟠 HIGH

### Affected Tests: 12 tests
- HabitForm Component: 6 tests
- ErrorState Component: 6 tests

### Error Message Examples

#### HabitForm Tests
```
Unable to find an element with the role "textbox" and name /habit name/i
Unable to find a button with the name /submit/i
```

#### ErrorState Tests
```
Unable to find a button with the name /retry/i
Unable to find an element with the text /error occurred/i
```

### Root Causes

#### Cause A: Component Not Rendering
- Component may not be mounting correctly
- Required props not provided to test component
- Provider wrappers missing (React Query, etc.)

#### Cause B: DOM Elements Not in Expected State
```typescript
// Expected:
<input placeholder="Habit name" />

// Actual:
Component may not render input at all
```

#### Cause C: Testing Library Configuration Issues
- jsdom not configured correctly
- Testing library not properly initialized
- Component dependencies not mocked

### Stack Trace Example
```
 ❯ Object.getElementError ../../node_modules/@testing-library/dom/dist/config.js:37:19
 ❯ ../../node_modules/@testing-library/dom/dist/query-helpers.js:76:38
 ❯ components/__tests__/HabitForm.test.tsx:85:31
     83|       );
     84|
     85|       const input = screen.getByRole('textbox', { name: /habit name/i });
       |                             ^
```

### Impact
- ❌ Component functionality not validated
- ❌ User interactions not testable
- ❌ UI correctness not verified
- ❌ Form submission flow broken

### Affected Components

#### HabitForm Component
**File**: `apps/web/components/__tests__/HabitForm.test.tsx`

Failing tests:
- Form rendering
- Input value changes
- Form submission
- Validation display
- Error handling
- Success callback

#### ErrorState Component
**File**: `apps/web/components/__tests__/ErrorState.test.tsx`

Failing tests:
- Error message display
- Error icon rendering
- Retry button display
- Retry button functionality
- Focus management
- Accessibility attributes

### Solution Steps

1. **Verify Component Exports**
   ```typescript
   // Check that components are properly exported
   export { HabitForm } from './HabitForm'
   export { ErrorState } from './ErrorState'
   ```

2. **Set Up Test Wrapper**
   ```typescript
   function renderWithProviders(component) {
     return render(
       <QueryClientProvider client={queryClient}>
         {component}
       </QueryClientProvider>
     )
   }
   ```

3. **Check vitest.config.ts**
   - Ensure jsdom is configured
   - Check React plugins are installed
   - Verify globals are enabled for testing library

4. **Fix Test Setup**
   - Add proper beforeEach hooks
   - Mock external dependencies
   - Configure testing library correctly

---

## Summary of Root Causes

| Issue | Severity | Type | Fix Effort |
|-------|----------|------|-----------|
| Missing Environment Variables | CRITICAL | Configuration | 15 min |
| Missing Auth Function Exports | CRITICAL | Implementation | 30 min |
| WebSocket Timeout Issues | CRITICAL | Timing/Logic | 1-2 hours |
| Component Rendering Issues | HIGH | Testing Setup | 1-2 hours |

---

## Recommended Fix Order

### Phase 1: Quick Wins (45 minutes)
1. Add environment variables to test setup
2. Export missing auth middleware functions
3. Increase WebSocket test timeouts

**Expected Result**: ~50 tests now pass

### Phase 2: WebSocket Debugging (1-2 hours)
1. Debug event emission logic
2. Fix Socket.IO configuration
3. Verify client/server connection

**Expected Result**: ~10 more tests pass

### Phase 3: Component Testing (1-2 hours)
1. Fix test setup and providers
2. Configure jsdom properly
3. Mock external dependencies

**Expected Result**: ~12 more tests pass

---

## Prevention Strategies

1. **Pre-commit Checks**
   - Run tests before allowing commits
   - Validate .env files in CI/CD

2. **Test Organization**
   - Separate unit, integration, component tests
   - Use different test timeouts per category
   - Clear test naming conventions

3. **Configuration Management**
   - Template .env files in repo
   - Document required env variables
   - Use environment-specific configs

4. **CI/CD Pipeline**
   - Run full test suite on all PRs
   - Fail builds on test failures
   - Provide detailed test reports

---

## Related Issues from Previous Runs

- **Run 6**: Similar integration test failures due to env setup
- **Run 5**: Auth middleware exports were initially missing
- **Run 4**: WebSocket timeout issues documented

This run consolidates all these issues in a single report.

---

**Analysis Date**: 2026-09-17  
**Test Run**: Run 7  
**Status**: Awaiting fixes
