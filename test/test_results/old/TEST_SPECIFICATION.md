# HabitQuest Test Specification

**Last Updated:** 2026-09-15
**Test Framework:** Vitest, React Testing Library, Supertest, Playwright
**Status:** In Progress

---

## Executive Summary

This document outlines comprehensive test coverage for the HabitQuest habit tracker application. Tests span:
- **Unit Tests**: Service logic and utilities
- **Integration Tests**: API endpoints with mocked auth
- **Component Tests**: React UI components
- **E2E Tests**: Complete user workflows

All tests use **mocked SSO providers** (no real Google/GitHub API calls).

---

## Test Categories

### 1. Authentication Tests

#### 1.1 SSO Login Success Path (Mock Provider)
**Type:** Unit + Integration
**Framework:** Vitest, Supertest
**Test ID:** `auth-001`

**Scenario:**
- User initiates Google/GitHub login
- Mock provider returns user profile
- User synced to database
- JWT token generated
- User redirected to dashboard

**Test Cases:**
- `✓ Google SSO login with valid profile returns JWT token`
- `✓ GitHub SSO login with valid profile returns JWT token`
- `✓ User email and name synced to database correctly`
- `✓ Existing user login updates profile info`
- `✓ JWT token contains correct userId, email, and expiration`

**Expected Results:**
- HTTP 200 response
- JWT token in response body/cookies
- User record in database
- Session established

---

### 2. Habit Management Tests

#### 2.1 Create Habit
**Type:** Integration
**Framework:** Supertest
**Test ID:** `habit-001`

**Test Cases:**
- `✓ Authenticated user can create habit with valid data`
- `✓ Habit creation includes name, description, frequency, target`
- `✓ Created habit belongs to authenticated user only`
- `✓ Cannot create habit without authentication`
- `✓ Cannot create habit with invalid frequency enum`
- `✓ Cannot create habit without required fields`

**Expected Results:**
- HTTP 201 Created
- Habit record in database scoped to userId
- Habit returned with id, createdAt, updatedAt

#### 2.2 Create Today's Check-in
**Type:** Integration
**Framework:** Supertest
**Test ID:** `checkin-001`

**Test Cases:**
- `✓ Authenticated user can create check-in for today`
- `✓ Check-in includes habitId, date, notes`
- `✓ Check-in belongs to authenticated user's habit only`
- `✓ Cannot create check-in without authentication`
- `✓ Cannot create check-in for non-existent habit`
- `✓ Cannot create check-in for another user's habit`

**Expected Results:**
- HTTP 201 Created
- Check-in record in database
- Streak counter updated
- Current streak visible

#### 2.3 Prevent Duplicate Check-in
**Type:** Integration
**Framework:** Supertest
**Test ID:** `checkin-002`

**Test Cases:**
- `✓ Cannot create second check-in for same habit/date`
- `✓ Duplicate check-in returns HTTP 409 Conflict`
- `✓ Error message indicates duplicate exists`
- `✓ First check-in unaffected by duplicate attempt`
- `✓ User can create check-in for different dates`

**Expected Results:**
- HTTP 409 Conflict for duplicate attempt
- Original check-in unchanged
- Error message: "Check-in already exists for this habit on [date]"

---

### 3. Authorization Tests

#### 3.1 User Isolation
**Type:** Integration
**Framework:** Supertest
**Test ID:** `auth-002`

**Scenario:** Verify strict user isolation at API level

**Test Cases:**
- `✓ User cannot fetch another user's habits (GET /habits/:id)`
- `✓ User cannot fetch another user's check-ins`
- `✓ User cannot update another user's habit`
- `✓ User cannot delete another user's habit`
- `✓ User cannot create check-in for another user's habit`
- `✓ User getHabits only returns their own habits`

**Expected Results:**
- HTTP 403 Forbidden or 404 Not Found
- No data leaked
- Request logged for audit trail

#### 3.2 Authentication Required
**Type:** Integration
**Framework:** Supertest
**Test ID:** `auth-003`

**Test Cases:**
- `✓ Unauthenticated requests to protected routes return 401`
- `✓ Invalid JWT token returns 401`
- `✓ Expired JWT token returns 401`
- `✓ Missing Authorization header returns 401`

**Expected Results:**
- HTTP 401 Unauthorized
- Consistent error message
- No data exposure

---

### 4. WebSocket Milestone Tests

#### 4.1 Streak Milestones (3, 7, 30 days)
**Type:** Integration
**Framework:** Vitest with mocked socket.io
**Test ID:** `websocket-001`

**Scenario:** User completes check-ins to reach milestone streaks

**Test Cases:**
- `✓ Milestone notification sent at 3-day streak`
- `✓ Milestone notification sent at 7-day streak`
- `✓ Milestone notification sent at 30-day streak`
- `✓ Notification includes habit name and current streak`
- `✓ Notification delivered to correct user session only`
- `✓ Notification appears in real-time across multiple browser tabs`

**Expected Results:**
- WebSocket event `"milestone"` with payload:
  ```json
  {
    "habitId": "string",
    "habitName": "string",
    "streak": number,
    "message": "Congratulations! 7-day streak!"
  }
  ```
- Event received within 100ms of check-in creation
- Only authenticated user receives notification

#### 4.2 Multiple Milestones Per Habit
**Type:** Integration
**Framework:** Vitest
**Test ID:** `websocket-002`

**Test Cases:**
- `✓ Each milestone (3, 7, 30) triggers separate notification`
- `✓ Skipping day resets milestone notifications`
- `✓ No duplicate notifications for same milestone`

**Expected Results:**
- Exactly 3 notifications across lifecycle
- Notifications at 3, 7, and 30 days only

---

### 5. Error Handling Tests

#### 5.1 UI Error Display
**Type:** Component
**Framework:** React Testing Library
**Test ID:** `ui-error-001`

**Test Cases:**
- `✓ Login form shows error message on failed auth`
- `✓ Habit creation shows validation errors for empty fields`
- `✓ Check-in form shows error for duplicate attempt`
- `✓ Network error displays user-friendly message`
- `✓ Unauthorized error redirects to login`

**Expected Results:**
- Error message visible on screen
- User can identify the issue
- User can retry or navigate away

#### 5.2 API Error Responses
**Type:** Integration
**Framework:** Supertest
**Test ID:** `error-002`

**Test Cases:**
- `✓ 400 Bad Request for invalid input`
- `✓ 401 Unauthorized for missing auth`
- `✓ 403 Forbidden for unauthorized access`
- `✓ 404 Not Found for non-existent resource`
- `✓ 409 Conflict for duplicate check-in`
- `✓ 500 Server error with safe message (no internal details)`

**Expected Results:**
- Correct HTTP status code
- Error object with `message` and optional `details`
- No stack traces exposed to client

---

## Startup Commands

### Prerequisites
```bash
# Node.js >= 20.0.0
node --version

# Install dependencies
npm install
```

### Development Environment Setup

#### 1. Database Setup (API)
```bash
# From project root
npm run db:push           # Create/sync database schema
npm run db:seed          # Populate test data (optional)
```

#### 2. Environment Variables
Create `.env.local` in `apps/web/`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
AUTH_SECRET=test-secret-key-min-32-chars-long!
INTERNAL_SECRET=test-internal-secret
```

Create `.env` in `apps/api/`:
```env
DATABASE_URL=file:./dev.db
AUTH_SECRET=test-secret-key-min-32-chars-long!
INTERNAL_SECRET=test-internal-secret
```

### Running Tests

#### Unit Tests (API)
```bash
npm run test -w apps/api      # Run all Vitest tests
npm run test -- --coverage -w apps/api   # With coverage
```

#### Component Tests (Web)
```bash
npm run test -w apps/web      # Run React Testing Library tests
```

#### API Integration Tests
```bash
npm run test -w apps/api -- src/**/*.test.ts  # API integration tests
```

#### E2E Tests
```bash
npm run test:e2e              # Run Playwright tests
npm run test:e2e -- --headed  # With browser visible
```

### Running Application Locally

#### Terminal 1: Start API (http://localhost:3001)
```bash
npm run dev -w apps/api
```

#### Terminal 2: Start Web (http://localhost:3000)
```bash
npm run dev -w apps/web
```

#### Verify Both Running
```bash
# Check API health
curl http://localhost:3001/health

# Check Web
open http://localhost:3000
```

---

## Test Data Requirements

### Users (Pre-created for Testing)
| Email | Name | Provider | Purpose |
|-------|------|----------|---------|
| user1@test.com | User One | Google | Primary user |
| user2@test.com | User Two | GitHub | Secondary user (authorization tests) |

### Habits
- Default habit for User One: "Morning Exercise"
- Default habit for User Two: "Read Books"

---

## Mock Configurations

### SSO Provider Mock (Google)
```javascript
{
  id: "google",
  name: "Google",
  type: "oauth",
  authorization: { params: { prompt: "consent" } },
  profile: {
    id: "123456789",
    name: "Test User",
    email: "user@test.com",
    image: "https://example.com/avatar.jpg",
    email_verified: true,
  },
}
```

### SSO Provider Mock (GitHub)
```javascript
{
  id: "github",
  name: "GitHub",
  type: "oauth",
  profile: {
    id: "987654321",
    login: "testuser",
    name: "Test User",
    email: "user@github.test.com",
    avatar_url: "https://example.com/avatar.jpg",
  },
}
```

### WebSocket Mock
- Socket.io client mocked with `jest.mock('socket.io-client')`
- Events manually triggered in tests
- No real WebSocket server required

---

## Success Criteria

- [ ] 100% of test cases pass locally
- [ ] No real Google/GitHub API calls in tests
- [ ] Application starts with `npm run dev` without errors
- [ ] All tests complete in < 30 seconds
- [ ] Test coverage > 80% for critical paths
- [ ] Error messages clear and user-friendly

---

## Next Steps

1. ✓ Create test specification (this document)
2. → Implement authentication tests
3. → Implement API integration tests
4. → Implement component tests
5. → Implement E2E tests
6. → Run full test suite and document results
