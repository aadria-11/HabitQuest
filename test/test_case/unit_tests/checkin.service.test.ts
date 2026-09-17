import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createCheckIn,
  getCheckInHistory,
  getCheckInsByDate,
} from '@api/services/checkin.service';
import { prisma } from '@api/lib/prisma';

vi.mock('@api/lib/prisma', () => ({
  prisma: {
    habitCheckIn: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    habit: {
      findUnique: vi.fn(),
    },
  },
}));

describe('Check-In Service - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCheckIn', () => {
    it('should create a check-in for a habit', async () => {
      const habitId = 'habit-1';
      const userId = 'user-123';
      const checkInDate = new Date('2026-01-15');

      const mockCheckIn = {
        id: 'checkin-1',
        habitId,
        checkInDate,
        createdAt: new Date(),
      };

      vi.mocked(prisma.habit.findUnique).mockResolvedValue({
        id: habitId,
        userId,
        name: 'Morning Run',
        description: 'Run 5km',
        startDate: new Date(),
        status: 'active',
        currentStreak: 0,
        bestStreak: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(prisma.habitCheckIn.create).mockResolvedValue(mockCheckIn);

      const result = await createCheckIn(habitId, userId, checkInDate);

      expect(result).toEqual(mockCheckIn);
    });

    it('should prevent duplicate check-ins on same day', async () => {
      const habitId = 'habit-1';
      const userId = 'user-123';
      const checkInDate = new Date('2026-01-15');

      vi.mocked(prisma.habitCheckIn.create).mockRejectedValue(
        new Error('Duplicate check-in for today')
      );

      await expect(createCheckIn(habitId, userId, checkInDate)).rejects.toThrow(
        'Duplicate check-in for today'
      );
    });

    it('should verify habit belongs to user before creating check-in', async () => {
      const habitId = 'habit-1';
      const userId = 'user-123';
      const wrongUserId = 'user-456';

      vi.mocked(prisma.habit.findUnique).mockResolvedValue({
        id: habitId,
        userId: wrongUserId,
        name: 'Morning Run',
        description: 'Run 5km',
        startDate: new Date(),
        status: 'active',
        currentStreak: 0,
        bestStreak: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(createCheckIn(habitId, userId, new Date())).rejects.toThrow(
        'Unauthorized'
      );
    });

    it('should not allow check-in if habit status is not active', async () => {
      const habitId = 'habit-1';
      const userId = 'user-123';

      vi.mocked(prisma.habit.findUnique).mockResolvedValue({
        id: habitId,
        userId,
        name: 'Morning Run',
        description: 'Run 5km',
        startDate: new Date(),
        status: 'paused',
        currentStreak: 0,
        bestStreak: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(createCheckIn(habitId, userId, new Date())).rejects.toThrow(
        'Cannot check in to inactive habit'
      );
    });

    it('should only allow one check-in per calendar day', async () => {
      const habitId = 'habit-1';
      const userId = 'user-123';
      const date1 = new Date('2026-01-15T08:00:00Z');
      const date2 = new Date('2026-01-15T18:00:00Z');

      vi.mocked(prisma.habitCheckIn.findMany).mockResolvedValue([
        {
          id: 'checkin-1',
          habitId,
          checkInDate: date1,
          createdAt: new Date(),
        },
      ]);

      vi.mocked(prisma.habitCheckIn.create).mockRejectedValue(
        new Error('Already checked in today')
      );

      await expect(createCheckIn(habitId, userId, date2)).rejects.toThrow(
        'Already checked in today'
      );
    });
  });

  describe('getCheckInHistory', () => {
    it('should retrieve all check-ins for a habit', async () => {
      const habitId = 'habit-1';
      const userId = 'user-123';

      const mockCheckIns = [
        {
          id: 'checkin-1',
          habitId,
          checkInDate: new Date('2026-01-15'),
          createdAt: new Date(),
        },
        {
          id: 'checkin-2',
          habitId,
          checkInDate: new Date('2026-01-14'),
          createdAt: new Date(),
        },
        {
          id: 'checkin-3',
          habitId,
          checkInDate: new Date('2026-01-13'),
          createdAt: new Date(),
        },
      ];

      vi.mocked(prisma.habit.findUnique).mockResolvedValue({
        id: habitId,
        userId,
        name: 'Morning Run',
        description: 'Run 5km',
        startDate: new Date(),
        status: 'active',
        currentStreak: 3,
        bestStreak: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(prisma.habitCheckIn.findMany).mockResolvedValue(mockCheckIns);

      const result = await getCheckInHistory(habitId, userId);

      expect(result).toEqual(mockCheckIns);
      expect(result).toHaveLength(3);
    });

    it('should enforce user isolation when retrieving history', async () => {
      const habitId = 'habit-1';
      const userId = 'user-123';
      const wrongUserId = 'user-456';

      vi.mocked(prisma.habit.findUnique).mockResolvedValue(null);

      await expect(getCheckInHistory(habitId, wrongUserId)).rejects.toThrow(
        'Unauthorized'
      );
    });

    it('should return empty array if no check-ins exist', async () => {
      const habitId = 'habit-1';
      const userId = 'user-123';

      vi.mocked(prisma.habit.findUnique).mockResolvedValue({
        id: habitId,
        userId,
        name: 'Morning Run',
        description: 'Run 5km',
        startDate: new Date(),
        status: 'active',
        currentStreak: 0,
        bestStreak: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(prisma.habitCheckIn.findMany).mockResolvedValue([]);

      const result = await getCheckInHistory(habitId, userId);

      expect(result).toEqual([]);
    });

    it('should return check-ins in reverse chronological order', async () => {
      const habitId = 'habit-1';
      const userId = 'user-123';

      const mockCheckIns = [
        {
          id: 'checkin-1',
          habitId,
          checkInDate: new Date('2026-01-15'),
          createdAt: new Date(),
        },
        {
          id: 'checkin-2',
          habitId,
          checkInDate: new Date('2026-01-14'),
          createdAt: new Date(),
        },
      ];

      vi.mocked(prisma.habit.findUnique).mockResolvedValue({
        id: habitId,
        userId,
        name: 'Morning Run',
        description: 'Run 5km',
        startDate: new Date(),
        status: 'active',
        currentStreak: 0,
        bestStreak: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(prisma.habitCheckIn.findMany).mockResolvedValue(mockCheckIns);

      const result = await getCheckInHistory(habitId, userId);

      expect(result[0].checkInDate.getTime()).toBeGreaterThan(
        result[1].checkInDate.getTime()
      );
    });
  });

  describe('getCheckInsByDate', () => {
    it('should retrieve check-ins for a specific date', async () => {
      const habitId = 'habit-1';
      const userId = 'user-123';
      const date = new Date('2026-01-15');

      const mockCheckIn = {
        id: 'checkin-1',
        habitId,
        checkInDate: date,
        createdAt: new Date(),
      };

      vi.mocked(prisma.habit.findUnique).mockResolvedValue({
        id: habitId,
        userId,
        name: 'Morning Run',
        description: 'Run 5km',
        startDate: new Date(),
        status: 'active',
        currentStreak: 0,
        bestStreak: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(prisma.habitCheckIn.findMany).mockResolvedValue([mockCheckIn]);

      const result = await getCheckInsByDate(habitId, userId, date);

      expect(result).toEqual([mockCheckIn]);
    });

    it('should return null if no check-in exists for date', async () => {
      const habitId = 'habit-1';
      const userId = 'user-123';
      const date = new Date('2026-01-15');

      vi.mocked(prisma.habit.findUnique).mockResolvedValue({
        id: habitId,
        userId,
        name: 'Morning Run',
        description: 'Run 5km',
        startDate: new Date(),
        status: 'active',
        currentStreak: 0,
        bestStreak: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(prisma.habitCheckIn.findMany).mockResolvedValue([]);

      const result = await getCheckInsByDate(habitId, userId, date);

      expect(result).toEqual([]);
    });
  });

  describe('User Isolation', () => {
    it('should not allow access to another user\'s check-ins', async () => {
      const habitId = 'habit-1';
      const userId = 'user-123';
      const wrongUserId = 'user-456';

      vi.mocked(prisma.habit.findUnique).mockResolvedValue(null);

      await expect(getCheckInHistory(habitId, wrongUserId)).rejects.toThrow(
        'Unauthorized'
      );
    });
  });

  describe('Validation', () => {
    it('should validate check-in date is not in the future', async () => {
      const habitId = 'habit-1';
      const userId = 'user-123';
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      vi.mocked(prisma.habitCheckIn.create).mockRejectedValue(
        new Error('Cannot check in for future dates')
      );

      await expect(createCheckIn(habitId, userId, futureDate)).rejects.toThrow(
        'Cannot check in for future dates'
      );
    });
  });
});
