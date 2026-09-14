================================================================================
HABIT TRACKER - TECHNICAL SPECIFICATION
================================================================================

PROJECT OVERVIEW

Build a responsive web application that allows users to manage personal habits,
track daily check-ins, and monitor habit streaks.

The application supports multiple users.

Requirements:

- Multiple users supported
- Users can only access their own habits
- No habit sharing between users
- SSO authentication only
- Real-time updates using WebSockets
- Modern, responsive UI
- Full test coverage

================================================================================
TECHNOLOGY STACK
================================================================================

Frontend
--------
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query (React Query)
- Socket.IO Client

Backend
-------
- Node.js
- Express
- TypeScript
- Prisma ORM
- Socket.IO

Database
--------
- PostgreSQL

Authentication
--------------
- Auth.js
- Google OIDC
- GitHub OAuth

Testing
-------
Frontend
- Vitest
- React Testing Library

Backend
- Vitest
- Supertest

End-to-End
- Playwright

================================================================================
FUNCTIONAL REQUIREMENTS
================================================================================

Authentication

- User signs in using Github and Google SSO
- No local username/password accounts
- User can log out
- Protected routes require authentication

User Isolation

- Every user can only access their own data
- Users cannot see habits belonging to another user
- All backend queries must filter by authenticated user ID

Habit Management

Users can:

- Create habit
- View habits
- Edit habit
- Delete habit
- Change habit status

Habit Fields

1. Name
2. Description
3. Start Date
4. Status

Supported Status Values

- Active
- Paused
- Archived

================================================================================
DAILY CHECK-IN REQUIREMENTS
================================================================================

Users can check in once per day for each habit.

Rules

- Maximum one check-in per habit per calendar day
- Consecutive daily check-ins increase streak
- Missing one day breaks the streak
- Streak is calculated from check-in history

Displayed Values

- Current Streak
- Best Streak

================================================================================
REAL-TIME WEBSOCKET REQUIREMENTS
================================================================================

The application must demonstrate two-way WebSocket communication.

Use Cases

1. Habit created
2. Habit updated
3. Habit deleted
4. Habit check-in completed
5. Streak updated

Example

User has the application open in multiple browser tabs.

When a habit is checked in from Tab A:

- Database is updated
- WebSocket event sent
- Tab B automatically refreshes

================================================================================
DATABASE MODEL
================================================================================
User Fields

- id
- email
- name
- image
- createdAt
- updatedAt

Habit Fields

- id
- userId
- name
- description
- startDate
- status
- currentStreak
- bestStreak
- createdAt
- updatedAt

HabitCheckIn Fields

- id
- habitId
- checkInDate
- createdAt

Relationships
User
  -> many Habits
Habit
  -> many HabitCheckIns

================================================================================
API REQUIREMENTS
================================================================================

Habit Endpoints

GET    /api/habits
GET    /api/habits/:id

POST   /api/habits

PUT    /api/habits/:id

DELETE /api/habits/:id

Check-In Endpoints

POST   /api/habits/:id/checkin

GET    /api/habits/:id/checkins

Authentication Routes

/auth/signin
/auth/signout
/auth/callback

================================================================================
WEBSOCKET EVENTS
================================================================================

Client -> Server

habit:subscribe
habit:update
habit:checkin

Server -> Client

habit:created
habit:updated
habit:deleted
habit:checkedin
streak:updated

================================================================================
UI REQUIREMENTS
================================================================================

General

- Responsive design
- Mobile friendly
- Modern UI
- Clean visual style
- Interactive components
- Loading states
- Error states
- Empty states

Pages
Login Page

- Google Sign In button
- GitHub Sign In button

Dashboard

Display:

- Total Habits
- Active Habits
- Current Best Streak
- Longest Streak

Habit List Page

Features:
- Search
- Status filtering
- Sorting
- Pagination

Habit Details Page

Display:
- Name
- Description
- Start Date
- Status
- Current Streak
- Best Streak
- Check-In History

Create Habit Page

Fields:
- Name
- Description
- Start Date
- Status

Edit Habit Page
Fields:
- Name
- Description
- Start Date
- Status

================================================================================
SECURITY REQUIREMENTS
================================================================================

Authentication
- SSO only
- No password storage
- Protected API endpoints

Authorization

All habit operations must verify:
- User is authenticated
- Habit belongs to authenticated user

Example Rule

WHERE habit.userId = currentUser.id
Users must never access another user's records.

================================================================================
TIMEZONE STRATEGY
================================================================================

Storage
- Store timestamps in UTC

Display
- Display dates using user local timezone

Streak Calculation
- Calculate streaks based on user local date

================================================================================
TESTING REQUIREMENTS
================================================================================

Frontend Tests

Tools
- Vitest
- React Testing Library

Coverage
- Form validation
- Dashboard rendering
- Habit filtering
- Check-in actions
- Authentication guards

Backend Tests

Tools
- Vitest
- Supertest

Coverage
- Habit CRUD
- Check-in logic
- Streak calculations
- Authorization
- Authentication middleware

E2E Tests

Tool
- Playwright

Scenarios
- Login
- Logout
- Create Habit
- Edit Habit
- Delete Habit
- Change Status
- Daily Check-In
- Streak Calculation
- User Isolation
- WebSocket Synchronization

================================================================================
NON-FUNCTIONAL REQUIREMENTS
================================================================================

Performance
- Dashboard load under 2 seconds
- Optimistic UI updates where appropriate

Maintainability
- Clean architecture
- TypeScript throughout
- Modular components
- Reusable services

Reliability
- Validation on frontend and backend
- Error handling
- Structured logging

================================================================================
PROJECT PHASES
================================================================================

Phase 1
- Project setup
- Database setup
- Prisma configuration
- Authentication

Phase 2
- Habit CRUD functionality

Phase 3
- Daily check-ins
- Streak calculation

Phase 4
- WebSocket integration

Phase 5
- Unit tests
- Integration tests
- E2E tests

Phase 6
- Deployment

================================================================================
DEFINITION OF DONE
================================================================================

The application is considered complete when:
- Users can authenticate via Google OIDC or GitHub OAuth
- Users can only view their own habits
- Habit CRUD operations work
- Status management works
- Daily check-ins work
- Current and best streaks are calculated correctly
- Real-time WebSocket updates work
- Frontend tests pass
- Backend tests pass
- Playwright E2E tests pass
- Application is deployable and production-ready

================================================================================
END OF SPECIFICATION
================================================================================