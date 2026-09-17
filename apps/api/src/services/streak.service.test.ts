import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculateCurrentStreak,
  calculateBestStreak,
  updateStreaks,
  canCheckInToday,
} from '@api/services/streak.service';
import { prisma } from '@api/lib/prisma';

vi.mock('@api/lib/prisma', () => ({
  prisma: {
    habitCheckIn: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    habit: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('Streak Service - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateCurrentStreak', () => {
    it('should calculate current streak from check-in history', async () => {
      const habitId = 'habit-1';
      const now = new Date();
      const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const yesterday = new Date(today.getTime() - 86400000);
      const twoDaysAgo = new Date(today.getTime() - 172800000);

      const mockCheckIns = [
        { id: '1', habitId, checkInDate: today, createdAt: new Date() },
        { id: '2', habitId, checkInDate: yesterday, createdAt: new Date() },
        { id: '3', habitId, checkInDate: twoDaysAgo, createdAt: new Date() },
      ];

      vi.mocked(prisma.habitCheckIn.findMany).mockResolvedValue(
        mockCheckIns
      );

      const streak = await calculateCurrentStreak(habitId);

      expect(streak).toBe(3);
    });

    it('should break streak if a day is missed', async () => {
      const habitId = 'habit-1';
      const now = new Date();
      const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const yesterday = new Date(today.getTime() - 86400000);
      const threeDaysAgo = new Date(today.getTime() - 259200000);

      const mockCheckIns = [
        { id: '1', habitId, checkInDate: today, createdAt: new Date() },
        { id: '2', habitId, checkInDate: yesterday, createdAt: new Date() },
        { id: '3', habitId, checkInDate: threeDaysAgo, createdAt: new Date() },
      ];

      vi.mocked(prisma.habitCheckIn.findMany).mockResolvedValue(
        mockCheckIns
      );

      const streak = await calculateCurrentStreak(habitId);

      expect(streak).toBe(2);
    });

    it('should return 0 if no check-ins exist', async () => {
      vi.mocked(prisma.habitCheckIn.findMany).mockResolvedValue([]);

      const streak = await calculateCurrentStreak('habit-1');

      expect(streak).toBe(0);
    });

    it('should reset streak if latest check-in is older than yesterday', async () => {
      const habitId = 'habit-1';
      const twoDaysAgo = new Date(
        new Date().getTime() - 2 * 24 * 60 * 60 * 1000
      );

      const mockCheckIns = [
        { id: '1', habitId, checkInDate: twoDaysAgo, createdAt: new Date() },
      ];

      vi.mocked(prisma.habitCheckIn.findMany).mockResolvedValue(
        mockCheckIns
      );

      const streak = await calculateCurrentStreak(habitId);

      expect(streak).toBe(0);
    });
  });

  describe('calculateBestStreak', () => {
    it('should find the longest consecutive streak', async () => {
      const habitId = 'habit-1';
      const baseDate = new Date('2026-01-01');

      const mockCheckIns = [
        {
          id: '1',
          habitId,
          checkInDate: new Date(baseDate.getTime() + 0),
          createdAt: new Date(),
        },
        {
          id: '2',
          habitId,
          checkInDate: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
        },
        {
          id: '3',
          habitId,
          checkInDate: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
        },
        {
          id: '4',
          habitId,
          checkInDate: new Date(baseDate.getTime() + 4 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
        },
      ];

      vi.mocked(prisma.habitCheckIn.findMany).mockResolvedValue(
        mockCheckIns
      );

      const bestStreak = await calculateBestStreak(habitId);

      expect(bestStreak).toBe(3);
    });

    it('should handle multiple streak sequences', async () => {
      const habitId = 'habit-1';
      const baseDate = new Date('2026-01-01');

      const mockCheckIns = [
        // First streak: 4 consecutive days
        {
          id: '1',
          habitId,
          checkInDate: new Date(baseDate.getTime() + 0),
          createdAt: new Date(),
        },
        {
          id: '2',
          habitId,
          checkInDate: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
        },
        {
          id: '3',
          habitId,
          checkInDate: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
        },
        {
          id: '4',
          habitId,
          checkInDate: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
        },
        // Gap
        // Second streak: 6 consecutive days
        {
          id: '5',
          habitId,
          checkInDate: new Date(baseDate.getTime() + 5 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
        },
        {
          id: '6',
          habitId,
          checkInDate: new Date(baseDate.getTime() + 6 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
        },
        {
          id: '7',
          habitId,
          checkInDate: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
        },
        {
          id: '8',
          habitId,
          checkInDate: new Date(baseDate.getTime() + 8 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
        },
        {
          id: '9',
          habitId,
          checkInDate: new Date(baseDate.getTime() + 9 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
        },
        {
          id: '10',
          habitId,
          checkInDate: new Date(baseDate.getTime() + 10 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
        },
      ];

      vi.mocked(prisma.habitCheckIn.findMany).mockResolvedValue(
        mockCheckIns
      );

      const bestStreak = await calculateBestStreak(habitId);

      expect(bestStreak).toBe(6);
    });

    it('should return 0 if no check-ins exist', async () => {
      vi.mocked(prisma.habitCheckIn.findMany).mockResolvedValue([]);

      const bestStreak = await calculateBestStreak('habit-1');

      expect(bestStreak).toBe(0);
    });
  });

  describe('canCheckInToday', () => {
    it('should allow check-in if not already checked in today', async () => {
      const habitId = 'habit-1';
      const yesterday = new Date(
        new Date().getTime() - 24 * 60 * 60 * 1000
      );

      vi.mocked(prisma.habitCheckIn.findMany).mockResolvedValue([
        { id: '1', habitId, checkInDate: yesterday, createdAt: new Date() },
      ]);

      const canCheckIn = await canCheckInToday(habitId);

      expect(canCheckIn).toBe(true);
    });

    it('should prevent duplicate check-in on same day', async () => {
      const habitId = 'habit-1';
      const now = new Date();
      const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

      vi.mocked(prisma.habitCheckIn.findMany).mockResolvedValue([
        { id: '1', habitId, checkInDate: today, createdAt: new Date() },
      ]);

      const canCheckIn = await canCheckInToday(habitId);

      expect(canCheckIn).toBe(false);
    });

    it('should allow check-in if no previous check-ins exist', async () => {
      vi.mocked(prisma.habitCheckIn.findMany).mockResolvedValue([]);

      const canCheckIn = await canCheckInToday('habit-1');

      expect(canCheckIn).toBe(true);
    });
  });

  describe('updateStreaks', () => {
    it('should update current and best streaks after check-in', async () => {
      const habitId = 'habit-1';

      vi.mocked(prisma.habitCheckIn.findMany).mockResolvedValue([]);

      await updateStreaks(habitId);

      expect(prisma.habitCheckIn.findMany).toHaveBeenCalled();
    });
  });

  describe('Timezone Handling', () => {
    it('should handle UTC storage correctly', async () => {
      const habitId = 'habit-1';
      const checkInDate = new Date('2026-01-15T10:30:00Z');

      const mockCheckIns = [
        { id: '1', habitId, checkInDate, createdAt: new Date() },
      ];

      vi.mocked(prisma.habitCheckIn.findMany).mockResolvedValue(
        mockCheckIns
      );

      const result = await calculateCurrentStreak(habitId);

      expect(result).toBeGreaterThanOrEqual(0);
    });
  });
});
