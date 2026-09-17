# Dependency Resolution Guide

## Issues Identified

### Issue #1: Missing @vitejs/plugin-react

**Error**:
```
Cannot find module '@vitejs/plugin-react'
Require stack:
- apps/web/vitest.config.ts
```

**Location**: `apps/web/vitest.config.ts:2`

**Resolution**:
```bash
cd apps/web
npm install -D @vitejs/plugin-react
```

**Verification**:
```bash
npm list @vitejs/plugin-react
```

---

### Issue #2: Missing @shared/schemas Package

**Error**:
```
Error: Cannot find package '@shared/schemas' imported from
src/routes/internal.routes.ts:4
```

**Affected Files**:
- `src/routes/internal.routes.ts` (import line 4)
- Used for: `SyncUserSchema`

**Analysis**:
The import suggests there should be a shared package with schemas:
```typescript
import { SyncUserSchema } from '@shared/schemas';
```

**Possible Solutions**:

#### Option A: Shared Package Exists
Check if the package exists but path alias is wrong:
```bash
# Check project structure
ls -la packages/
# Look for a schemas or shared directory
```

If found, verify path alias in `vitest.config.ts` or `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@shared/*": ["packages/shared/src/*"]
    }
  }
}
```

#### Option B: Create Shared Package
```bash
mkdir -p packages/shared/src
cd packages/shared
npm init -y
# Then create schemas directory
```

#### Option C: Fix Imports (Temporary)
If the schema isn't needed for tests, comment out the import:
```typescript
// import { SyncUserSchema } from '@shared/schemas';
```

**Recommended**: Option A - Locate existing package and fix path alias

---

## Installation Steps

### Step 1: Install Missing Frontend Dependency
```bash
cd C:\Users\aonutu\ClaudeProjects\HabitQuest\apps\web
npm install -D @vitejs/plugin-react
```

**Expected Output**:
```
added 1 package, and audited XX packages in Xs
```

### Step 2: Verify Installation
```bash
npm list @vitejs/plugin-react
# Should show: @vitejs/plugin-react@X.X.X
```

### Step 3: Fix @shared/schemas Import

**Option A: Find the Package**
```bash
# From root directory
find . -path "*/packages/shared*" -o -path "*/@shared*"
# Or check tsconfig
cat apps/api/tsconfig.json | grep -A 5 '"paths"'
```

**Option B: Create Missing Schema**
```bash
# Create packages/shared structure
mkdir -p packages/shared/src/schemas
cat > packages/shared/src/schemas/index.ts << 'EOF'
export const SyncUserSchema = {
  // Add schema definition
};
EOF
```

**Option C: Update Path Alias**
Edit `apps/api/vitest.config.ts`:
```typescript
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
});
```

### Step 4: Run Tests Again
```bash
npm test
```

---

## Verification Checklist

After resolving dependencies, verify:

- [ ] `@vitejs/plugin-react` installed in `apps/web`
- [ ] `@shared/schemas` can be imported
- [ ] No module resolution errors
- [ ] All 22 existing tests run (may fail, but should execute)
- [ ] New test files don't have import errors

---

## Quick Fix Commands

```bash
# Install all dependencies from scratch
npm ci

# Install missing plugin
npm install -D @vitejs/plugin-react -w apps/web

# Verify vitest config
npm run typecheck

# Run tests to confirm
npm test -- --reporter=verbose

# If still failing, clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm test
```

---

## Expected Results After Fix

### Before
```
✗ Web tests: Failed to load
✗ Integration tests: Failed to load (missing @shared/schemas)
✓ API service tests: 20/22 passing (90.9%)
```

### After
```
✓ Web tests: Should load and run
✓ Integration tests: Should load and run
✓ API service tests: 20/22 passing (90.9%)
✓ New test suite: Ready to execute (154 tests)
```

---

## Troubleshooting

### If still getting module errors:

1. **Clear cache**:
   ```bash
   npm run clean
   npm ci
   ```

2. **Check vitest config**:
   ```bash
   npm run typecheck
   ```

3. **Verify paths**:
   ```bash
   cat tsconfig.json | grep -A 5 paths
   cat vitest.config.ts | grep -A 10 resolve
   ```

4. **Test single file**:
   ```bash
   npm test -- apps/web/test.ts
   ```

---

## Path Alias Reference

### Current Aliases
Check with:
```bash
cat apps/api/tsconfig.json | grep -A 10 '"paths"'
cat apps/web/tsconfig.json | grep -A 10 '"paths"'
```

### Common Aliases Needed
```json
{
  "@api/*": ["apps/api/src/*"],
  "@web/*": ["apps/web/*"],
  "@shared/*": ["packages/shared/src/*"]
}
```

---

**Next Step**: After resolving these dependencies, run:
```bash
npm test -- --reporter=verbose
```

Should see all 22 existing tests + capability to run new 154 tests.

