export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type HabitStatus = 'ACTIVE' | 'PAUSED' | 'ARCHIVED';

export interface Habit {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  startDate: Date;
  status: HabitStatus;
  currentStreak: number;
  bestStreak: number;
  checkInCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface HabitCheckIn {
  id: string;
  habitId: string;
  checkInDate: Date;
  comment: string | null;
  createdAt: Date;
}

export interface JWTPayload {
  userId: string;
  email: string;
  name: string | null;
}

export interface AuthenticatedRequest {
  user: JWTPayload;
}

// WebSocket event types
export interface HabitCreatedEvent {
  type: 'habit:created';
  data: Habit;
}

export interface HabitUpdatedEvent {
  type: 'habit:updated';
  data: Habit;
}

export interface HabitDeletedEvent {
  type: 'habit:deleted';
  habitId: string;
}

export interface HabitCheckedInEvent {
  type: 'habit:checkedin';
  habitId: string;
  checkInDate: Date;
}

export interface StreakUpdatedEvent {
  type: 'streak:updated';
  habitId: string;
  currentStreak: number;
  bestStreak: number;
}

export interface CheckInCancelledEvent {
  type: 'checkin:cancelled';
  habitId: string;
  checkInId: string;
}

export type WSEvent =
  | HabitCreatedEvent
  | HabitUpdatedEvent
  | HabitDeletedEvent
  | HabitCheckedInEvent
  | StreakUpdatedEvent
  | CheckInCancelledEvent;
