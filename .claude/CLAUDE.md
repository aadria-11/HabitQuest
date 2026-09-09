# CLAUDE.md

## Project Overview

Build a responsive Habit Tracker web application that allows authenticated users to:

- Create, update, delete, and manage habits
- Perform daily habit check-ins
- Track current and best streaks
- View habit history
- Receive real-time updates across browser sessions

The application supports multiple users and enforces strict user isolation.

When architectural decisions are required, follow @ARCHITECTURE.md
When implementation details are required, follow @TECH_SPEC.md
---

# IMPORTANT RULES

## Authentication

Authentication is SSO-only.

Use:

- Auth.js
- Microsoft Entra ID (Azure AD)

Do NOT implement:

- Username/password authentication
- Registration forms
- Password reset functionality
- Local credential storage

Protected pages and APIs must require authentication.

---

## Authorization

Security is critical.

Every habit query must be scoped to the authenticated user.

Example:

```ts
where: {
  userId: session.user.id
}