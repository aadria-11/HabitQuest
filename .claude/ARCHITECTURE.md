# ARCHITECTURE.md

# Habit Tracker Application Architecture

## 1. Overview

### Purpose

Habit Tracker is a multi-user web application that enables authenticated users to create and manage personal habits, perform daily check-ins, and track habit streaks over time.

The application supports:

- Multiple users
- SSO authentication only
- Complete user isolation
- Habit CRUD operations
- Daily habit check-ins
- Current and best streak tracking
- Real-time updates through WebSockets
- Responsive modern UI
- Automated testing

---

## 2. High-Level Architecture

```text
┌─────────────────────────────────────────┐
│                 Browser                 │
│                                          │
│ Next.js + React + TypeScript            │
│ Tailwind + shadcn/ui                    │
│ React Query                             │
│ Socket.IO Client                        │
└─────────────────┬───────────────────────┘
                  │
                  │ HTTPS
                  │
┌─────────────────▼───────────────────────┐
│               Next.js App               │
│                                          │
│ UI Components                           │
│ Authentication Integration              │
│ React Query Data Layer                  │
│ WebSocket Client                        │
└─────────────────┬───────────────────────┘
                  │
                  │ REST API
                  │ WebSocket
                  │
┌─────────────────▼───────────────────────┐
│          Node.js / Express API          │
│                                          │
│ Controllers                             │
│ Services                                │
│ Business Logic                          │
│ Socket.IO Server                        │
│ Auth Validation                         │
└─────────────────┬───────────────────────┘
                  │
                  │ Prisma ORM
                  │
┌─────────────────▼───────────────────────┐
│              PostgreSQL                 │
│                                          │
│ Users                                   │
│ Habits                                  │
│ Habit Check-Ins                         │
└─────────────────────────────────────────┘