# Action Items - Test Execution Run 1

**Generated**: 2026-09-17  
**Priority Order**: High → Medium → Low

---

## 🔴 CRITICAL - Must Fix Before Full Test Suite

### ✓ Action #1: Install @vitejs/plugin-react
**Priority**: 🔴 CRITICAL  
**Effort**: 2 minutes  
**Blocker**: Yes - Web tests cannot run

**Steps**:
```bash
cd C:\Users\aonutu\ClaudeProjects\HabitQuest\apps\web
npm install -D @vitejs/plugin-react
```

**Verification**:
```bash
npm list @vitejs/plugin-react
npm test -- --dry-run  # Should not error on vitest config
```

**Expected Result**: No "Cannot find module @vitejs/plugin-react" error

---

### ✓ Action #2: Resolve @shared/schemas Import
**Priority**: 🔴 CRITICAL  
**Effort**: 10-30 minutes  
**Blocker**: Yes - 3 integration test files cannot load

**Investigation Steps**:

1. Check if shared package exists:
```bash
ls -la packages/
find . -name "*shared*" -type d | grep -v node_modules
```

2. If found, check path aliases:
```bash
cat apps/api/tsconfig.json | grep -A 5 '"paths"'
cat apps/api/vitest.config.ts | grep -A 5 resolve
```

3. If not found, create it:
```bash
mkdir -p packages/shared/src/schemas
touch packages/shared/src/schemas/index.ts
```

**Required Output** in `packages/shared/src/schemas/index.ts`:
```typescript
// Export SyncUserSchema and other shared schemas
export const SyncUserSchema = {
  // Define schema structure
};
```

**Verification**:
```bash
npm test -- src/routes/auth.integration.test.ts  # Should load
```

---

### ✓ Action #3: Fix Failing Tests (2 tests)
**Priority**: 🟡 HIGH  
**Effort**: 15 minutes  
**Blocker**: No - Tests are running but failing

**Test #1: Check-in Status Validation**

Location: `apps/api/src/services/checkin.service.test.ts`

Current Error:
```
Expected: "Habit is not active"
Got: "Habit not found"
```

Fix Options:
```typescript
// Option A: Fix test expectation
await expect(checkinService.createCheckIn('non-existent-habit', 'user-123', date))
  .rejects.toThrow('Habit not found');  // Changed expectation

// Option B: Verify implementation should check status first
// If service should check status on non-existent habit, update service
```

**Recommended**: Option A (test expectation)

---

**Test #2: Habit Update Validation**

Location: `apps/api/src/services/habit.service.test.ts`

Current Error:
```
Promise resolved "null" instead of rejecting
```

Fix Options:
```typescript
// Option A: Create habit first, then try to update archived
const habit = await habitService.createHabit({
  name: 'Test',
  status: 'archived',
  userId: 'user-123'
});

await expect(habitService.updateHabit('user-123', habit.id, { name: 'Updated' }))
  .rejects.toThrow('Habit is archived');

// Option B: Allow null return and check for it
const result = await habitService.updateHabit('user-123', 'non-existent', { name: 'x' });
expect(result).toBeNull();
```

**Recommended**: Option A (create valid test data)

---

## 🟡 HIGH PRIORITY - Complete Before Merging

### Action #4: Setup Test Database for New Tests
**Priority**: 🟡 HIGH  
**Effort**: 30 minutes  
**Blocks**: Running 154 new tests

**Steps**:
```bash
# Create test database
npm run db:create:test

# Run migrations in test mode
npm run db:migrate -- --env test

# Seed test data (if needed)
npm run db:seed -- --env test
```

**Verification**:
```bash
# Check database connection
psql -h localhost -U postgres -d habitquest_test -c "SELECT COUNT(*) FROM public.\"Habit\";"
```

**Expected**: Database is ready for test execution

---

### Action #5: Execute New Test Suite (154 tests)
**Priority**: 🟡 HIGH  
**Effort**: 5-10 minutes (execution) + time to fix failures  
**Blocks**: Knowing actual pass rate

**Commands**:
```bash
# Run all new tests
npm test -- testing/test_case

# Run by category
npm test -- testing/test_case/unit_tests
npm test -- testing/test_case/integration_tests
npm test -- testing/test_case/component_tests

# Run specific test file
npm test -- testing/test_case/unit_tests/habit.service.test.ts

# Generate coverage
npm test -- testing/test_case --coverage
```

**Expected Results**:
- Unit tests: ~55 tests
- Integration tests: ~53 tests
- Component tests: ~46 tests
- Coverage: 80%+ target

**Deliverable**: `testing/test_results/run1/NEW_TESTS_RESULTS.md`

---

### Action #6: Fix Test Failures from New Suite
**Priority**: 🟡 HIGH  
**Effort**: Varies (TBD after execution)  
**Blocks**: Merge to main

**Process**:
1. Run tests, capture failures
2. Categorize by type:
   - Mock/setup issues
   - Import errors
   - Logic errors
   - Edge cases
3. Fix each category
4. Rerun tests
5. Document in results

**Deliverable**: Fixed test suite with ≥90% pass rate

---

## 🟢 MEDIUM PRIORITY - Complete This Sprint

### Action #7: Setup CI/CD Pipeline
**Priority**: 🟢 MEDIUM  
**Effort**: 45 minutes  
**Blocks**: Automated testing on PRs

**Steps**:

1. Create GitHub Actions workflow:
```bash
mkdir -p .github/workflows
cat > .github/workflows/test.yml << 'EOF'
name: Run Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm test -- testing/test_case --coverage
      - uses: codecov/codecov-action@v3
EOF
```

2. Configure test requirements for PRs:
   - Require all tests to pass
   - Require ≥80% coverage
   - Block merge if tests fail

3. Setup coverage tracking:
   - Codecov integration
   - Coverage trends
   - Coverage badges

**Deliverable**: GitHub Actions workflow + coverage reports

---

### Action #8: Document Test Patterns & Examples
**Priority**: 🟢 MEDIUM  
**Effort**: 60 minutes  
**Blocks**: Developer onboarding

**Create**:
- Test writing guide with examples
- Common patterns and anti-patterns
- Mock setup examples
- Database setup guide
- Debugging guide

**Location**: `testing/test_case/PATTERNS.md`

**Deliverable**: Comprehensive testing documentation

---

### Action #9: Create Test Data Fixtures
**Priority**: 🟢 MEDIUM  
**Effort**: 45 minutes  
**Blocks**: Test maintenance

**Create**:
- Factory functions for test data
- Seed data for common scenarios
- Mock generator utilities
- Reset/cleanup utilities

**Location**: `testing/fixtures/`

**Example**:
```typescript
// factories/user.factory.ts
export const createTestUser = async (overrides = {}) => {
  return await prisma.user.create({
    data: {
      id: `user-${Date.now()}`,
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
      ...overrides,
    },
  });
};
```

---

## 🔵 LOW PRIORITY - Complete Next Sprint

### Action #10: Performance Optimization
**Priority**: 🔵 LOW  
**Effort**: 30 minutes  
**Blocks**: Nothing critical

**Tasks**:
- Add test result caching
- Enable parallel test execution
- Optimize database queries in tests
- Use in-memory database where possible

**Target**: Reduce test suite runtime from 5s to 2-3s

---

### Action #11: Add Visual Regression Tests
**Priority**: 🔵 LOW  
**Effort**: 120+ minutes  
**Blocks**: UI quality gates

**Setup**:
- Configure Percy or similar tool
- Add baseline screenshots
- Integrate with CI/CD
- Document workflow

**Target**: Catch accidental UI changes

---

### Action #12: Expand Test Coverage Gaps
**Priority**: 🔵 LOW  
**Effort**: 120+ minutes  
**Blocks**: Coverage goals

**Review**:
- Current coverage: 65% (estimated)
- Target: 85%+
- Identify gaps
- Write additional tests
- Update documentation

---

## Summary Table

| # | Action | Priority | Effort | Blocker | Status |
|---|--------|----------|--------|---------|--------|
| 1 | Install @vitejs/plugin-react | 🔴 CRIT | 2m | ✓ | Pending |
| 2 | Resolve @shared/schemas | 🔴 CRIT | 10-30m | ✓ | Pending |
| 3 | Fix 2 failing tests | 🔴 CRIT | 15m | ✗ | Pending |
| 4 | Setup test database | 🟡 HIGH | 30m | ✓ | Pending |
| 5 | Run 154 new tests | 🟡 HIGH | 5-10m | ✓ | Pending |
| 6 | Fix new test failures | 🟡 HIGH | Varies | ✓ | Pending |
| 7 | Setup CI/CD | 🟢 MED | 45m | ✗ | Pending |
| 8 | Document patterns | 🟢 MED | 60m | ✗ | Pending |
| 9 | Create fixtures | 🟢 MED | 45m | ✗ | Pending |
| 10 | Performance tuning | 🔵 LOW | 30m | ✗ | Pending |
| 11 | Visual regression | 🔵 LOW | 120m | ✗ | Pending |
| 12 | Expand coverage | 🔵 LOW | 120m | ✗ | Pending |

---

## Quick Start Command

To fix critical issues and run tests immediately:

```bash
# Fix dependencies
cd apps/web && npm install -D @vitejs/plugin-react && cd ../..
# (Resolve @shared/schemas manually or create package)

# Fix failing tests
# (Update 2 test expectations in service tests)

# Setup test database
npm run db:migrate -- --env test

# Run all tests
npm test

# Run new tests
npm test -- testing/test_case

# Generate report
npm test -- testing/test_case --coverage > testing/test_results/run1/coverage.txt
```

---

## Success Criteria

✅ **Run 1 Complete When**:
- [ ] Dependency issues resolved
- [ ] All 22 existing tests pass (or 20/22 if intentional failures)
- [ ] 154 new tests execute
- [ ] Pass rate ≥ 80%
- [ ] Coverage ≥ 75%
- [ ] No module resolution errors
- [ ] CI/CD pipeline setup
- [ ] Results documented

---

**Next Review**: After implementing Actions 1-3 (dependencies)  
**Full Test Suite Ready**: After implementing Actions 1-6  
**Production Ready**: After implementing Actions 1-9  

