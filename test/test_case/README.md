# HabitQuest Test Suite

Comprehensive test cases for the HabitQuest application covering unit tests, integration tests, component tests, and WebSocket functionality.

## Directory Structure

```
testing/test_case/
├── unit_tests/
│   ├── habit.service.test.ts          - Habit CRUD operations
│   ├── streak.service.test.ts         - Streak calculation logic
│   ├── checkin.service.test.ts        - Check-in functionality
│   └── auth.middleware.test.ts        - Authentication middleware
├── integration_tests/
│   ├── habit.api.integration.test.ts  - Habit API endpoints
│   ├── checkin.api.integration.test.ts - Check-in API endpoints
│   └── websocket.integration.test.ts  - WebSocket real-time updates
├── component_tests/
│   ├── habit-form.component.test.tsx  - Habit creation/edit form
│   └── dashboard.component.test.tsx   - Dashboard display
└── README.md                           - This file
```

## Test Categories

### Unit Tests

Unit tests focus on individual functions and services in isolation using mocks.

#### **habit.service.test.ts**
- `createHabit` - Creating habits with validation and user scoping
- `updateHabit` - Updating habits with authorization checks
- `deleteHabit` - Deleting habits with user isolation
- `getHabitById` - Retrieving single habit with scoping
- `getUserHabits` - Retrieving all habits for a user with filtering
- **Coverage**: CRUD operations, user isolation, validation, status values

#### **streak.service.test.ts**
- `calculateCurrentStreak` - Calculating current streaks from check-in history
- `calculateBestStreak` - Finding longest consecutive streaks
- `canCheckInToday` - Checking if daily check-in is allowed
- `updateStreaks` - Updating streak values after check-ins
- **Coverage**: Streak calculations, streak breaking logic, timezone handling

#### **checkin.service.test.ts**
- `createCheckIn` - Creating daily check-ins
- `getCheckInHistory` - Retrieving check-in records
- `getCheckInsByDate` - Finding check-ins for specific dates
- **Coverage**: Daily limits, duplicate prevention, user isolation, validation

#### **auth.middleware.test.ts**
- `verifyAuthSession` - Session validation
- `protectedRoute` - Route protection
- **Coverage**: SSO support (Google, GitHub), session expiration, authentication requirements

### Integration Tests

Integration tests verify API endpoints work correctly with real-world scenarios.

#### **habit.api.integration.test.ts**
API Endpoints Tested:
- `GET /api/habits` - List habits with filtering and pagination
- `POST /api/habits` - Create new habit
- `GET /api/habits/:id` - Get habit details
- `PUT /api/habits/:id` - Update habit
- `DELETE /api/habits/:id` - Delete habit

Test Scenarios:
- Authentication requirements
- User isolation and authorization
- Input validation
- Status filtering (active, paused, archived)
- Pagination support

#### **checkin.api.integration.test.ts**
API Endpoints Tested:
- `POST /api/habits/:id/checkin` - Create check-in
- `GET /api/habits/:id/checkins` - Get check-in history

Test Scenarios:
- Duplicate check-in prevention
- Habit status validation (not paused/archived)
- Future date prevention
- User isolation
- Streak calculation integration
- Check-in reversal logic

#### **websocket.integration.test.ts**
WebSocket Events Tested:

Client → Server:
- `habit:subscribe` - Subscribe to habit updates
- `habit:update` - Update habit
- `habit:checkin` - Check in to habit

Server → Client:
- `habit:created` - Habit creation broadcast
- `habit:updated` - Habit update broadcast
- `habit:deleted` - Habit deletion broadcast
- `habit:checkedin` - Check-in completion broadcast
- `streak:updated` - Streak update broadcast

Test Scenarios:
- Connection management
- Real-time synchronization across tabs
- Event broadcasting
- Authentication in WebSocket
- Error handling
- Reconnection support

### Component Tests

Component tests verify React components render and function correctly.

#### **habit-form.component.test.tsx**
- Form field rendering (name, description, date, status)
- Input validation
- Form submission
- Edit mode population
- Error display
- Accessibility (labels, keyboard navigation)
- Responsive design

#### **dashboard.component.test.tsx**
- Dashboard rendering
- Stats display (total, active, best streak)
- Habit list rendering
- Loading states
- Error states
- Navigation links
- Filtering and sorting
- User authentication display
- Accessibility

## Running the Tests

### Run All Tests
```bash
npm test
```

### Run Tests by Category
```bash
# Unit tests only
npm test -- testing/test_case/unit_tests

# Integration tests only
npm test -- testing/test_case/integration_tests

# Component tests only
npm test -- testing/test_case/component_tests
```

### Run Specific Test File
```bash
npm test -- testing/test_case/unit_tests/habit.service.test.ts
```

### Run Tests with Coverage
```bash
npm test -- --coverage testing/test_case
```

### Watch Mode (for development)
```bash
npm test -- --watch
```

## Testing Technologies

- **Vitest** - Fast unit test framework
- **React Testing Library** - React component testing
- **Supertest** - HTTP assertion library for API testing
- **Socket.IO Client** - WebSocket testing

## Test Coverage Goals

| Category | Target | Tests |
|----------|--------|-------|
| Unit Tests | 80%+ | Services, utilities, middleware |
| Integration Tests | 85%+ | API endpoints, WebSocket |
| Component Tests | 75%+ | UI components, forms |
| **Overall** | **80%+** | **Full application** |

## Key Testing Principles

### 1. User Isolation
Every test verifies that users cannot access other users' data:
```typescript
// User 1 creates habit
// User 2 tries to access
// Should get 403 Forbidden
```

### 2. Authorization
All modifying operations require authentication and ownership verification:
```typescript
// Unauthenticated request → 401 Unauthorized
// Wrong user → 403 Forbidden
```

### 3. Validation
All inputs are validated at both client and server:
- Required fields
- Valid status values (active, paused, archived)
- Date format and range
- String length limits

### 4. Streak Logic
Critical calculations are tested:
- Consecutive day streaks
- Streak breaking on missed days
- Best streak tracking
- Timezone handling (UTC storage, local display)

### 5. Real-time Synchronization
WebSocket events ensure consistency across sessions:
- Tab A updates habit → Tab B receives update
- Check-in in Tab A → Other tabs see streak update
- Creation/deletion broadcasts to all sessions

## Mock Data

Tests use realistic mock data:
- User IDs: `user-123`, `user-456`, `different-user`
- Habit IDs: `habit-1`, `habit-2`
- Check-in dates: ISO format, UTC timestamps
- Statuses: `active`, `paused`, `archived`

## Common Test Patterns

### Testing User Isolation
```typescript
it('should prevent access to other user\'s data', async () => {
  // Create as user-123
  const response = await createHabit(habitData);
  
  // Access as user-456
  await expect(getHabit(habitId, 'user-456'))
    .rejects.toThrow('Unauthorized');
});
```

### Testing Validation
```typescript
it('should validate required fields', async () => {
  await expect(createHabit({}))
    .rejects.toThrow('Missing required fields');
});
```

### Testing Streaks
```typescript
it('should calculate streak correctly', async () => {
  // 3 consecutive days
  const streak = await calculateCurrentStreak(habitId);
  expect(streak).toBe(3);
});
```

### Testing WebSocket
```typescript
it('should broadcast event to all clients', async () => {
  const client1 = ioClient(...);
  const client2 = ioClient(...);
  
  client1.emit('habit:checkin', data);
  
  await new Promise(resolve => {
    client2.on('habit:checkedin', () => resolve());
  });
});
```

## Debugging Tests

### Verbose Output
```bash
npm test -- --reporter=verbose
```

### Debug Single Test
```bash
node --inspect-brk node_modules/.bin/vitest run testing/test_case/unit_tests/habit.service.test.ts
```

### Check Test Coverage
```bash
npm test -- --coverage
```

## Contributing New Tests

When adding new features, include:

1. **Unit tests** for business logic
2. **Integration tests** for API endpoints
3. **Component tests** for UI
4. **WebSocket tests** for real-time features

Ensure all tests:
- Have clear, descriptive names
- Test one thing per test
- Include both success and failure cases
- Verify user isolation
- Check error handling

## Known Issues & Limitations

- WebSocket tests require manual server setup
- Timezone tests use mock dates
- Some tests may require database seeding
- E2E tests are in separate `e2e/` directory

## Next Steps

1. Set up test database fixtures
2. Add performance benchmarks
3. Create test data factories
4. Add visual regression tests
5. Set up CI/CD integration

## Resources

- [Vitest Documentation](https://vitest.dev)
- [React Testing Library](https://testing-library.com/react)
- [Supertest](https://github.com/visionmedia/supertest)
- [Socket.IO Testing](https://socket.io/docs/v4/testing/)
