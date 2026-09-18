import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createCheckIn,
  getCheckIns,
} from '@api/services/checkin.service';
import { prisma } from '@api/lib/prisma';

describe('Check-In Service - Unit Tests', () => {
  beforeEach(() => {
    // Reset call history but preserve mock implementations
    Object.keys(prisma).forEach((key) => {
      if (typeof prisma[key as keyof typeof prisma] === 'object') {
        Object.values(prisma[key as keyof typeof prisma] as any).forEach((fn) => {
          if (typeof fn?.mockClear === 'function') fn.mockClear();
        });
      }
    });
  });

  describe('createCheckIn', () => {
    it('should create a check-in for a habit', async () => {
      const habitId = 'habit-1';
      const userId = 'user-123';
      const checkInDate = '2026-01-15';

      const mockHabit = {
        id: habitId,
        userId,
        name: 'Morning Run',
        description: 'Run 5km',
        startDate: new Date(),
        status: 'ACTIVE',
        currentStreak: 0,
        bestStreak: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockCheckIn = {
        id: 'checkin-1',
        habitId,
        checkInDate: new Date(checkInDate),
        comment: null,
        createdAt: new Date(),
      };

      vi.mocked(prisma.habit.findFirst).mockResolvedValue(mockHabit as any);
      vi.mocked(prisma.habitCheckIn.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const mockTx = {
          habitCheckIn: {
            create: vi.fn().mockResolvedValue(mockCheckIn),
            findMany: vi.fn().mockResolvedValue([]),
          },
          habit: {
            update: vi.fn().mockResolvedValue({}),
          },
        };
        const result = await callback(mockTx as any);
        return result;
      });

      const result = await createCheckIn(habitId, userId, checkInDate);

      expect(result).toBeDefined();
      expect(result.habitId).toBe(habitId);
    });

    it('should prevent duplicate check-ins on same day', async () => {
      const habitId = 'habit-1';
      const userId = 'user-123';
      const checkInDate = '2026-01-15';

      const mockHabit = {
        id: habitId,
        userId,
        name: 'Morning Run',
        status: 'ACTIVE',
      };

      const existingCheckIn = { id: 'checkin-1', habitId, checkInDate: new Date(checkInDate) };

      vi.mocked(prisma.habit.findFirst).mockResolvedValue(mockHabit as any);
      vi.mocked(prisma.habitCheckIn.findUnique).mockResolvedValue(existingCheckIn as any);

      await expect(createCheckIn(habitId, userId, checkInDate)).rejects.toThrow(
        'Already checked in today'
      );
    });

    it('should verify habit belongs to user before creating check-in', async () => {
      const habitId = 'habit-1';
      const userId = 'user-123';
      const wrongUserId = 'user-456';

      // findFirst returns null when habit doesn't belong to user
      vi.mocked(prisma.habit.findFirst).mockResolvedValue(null);

      await expect(createCheckIn(habitId, wrongUserId, '2026-01-15')).rejects.toThrow(
        'Habit not found'
      );
    });

    it('should not allow check-in if habit status is not active', async () => {
      const habitId = 'habit-1';
      const userId = 'user-123';

      const mockHabit = {
        id: habitId,
        userId,
        name: 'Morning Run',
        status: 'PAUSED',
      };

      vi.mocked(prisma.habit.findFirst).mockResolvedValue(mockHabit as any);

      await expect(createCheckIn(habitId, userId, '2026-01-15')).rejects.toThrow(
        'Habit is not active'
      );
    });

    it('should only allow one check-in per calendar day', async () => {
      const habitId = 'habit-1';
      const userId = 'user-123';
      const checkInDate = '2026-01-15';

      const mockHabit = {
        id: habitId,
        userId,
        status: 'ACTIVE',
      };

      const existingCheckIn = { id: 'checkin-1', habitId, checkInDate: new Date(checkInDate) };

      vi.mocked(prisma.habit.findFirst).mockResolvedValue(mockHabit as any);
      vi.mocked(prisma.habitCheckIn.findUnique).mockResolvedValue(existingCheckIn as any);

      await expect(createCheckIn(habitId, userId, checkInDate)).rejects.toThrow(
        'Already checked in today'
      );
    });
  });

  describe('getCheckIns', () => {
    it('should retrieve all check-ins for a habit', async () => {
      const habitId = 'habit-1';
      const userId = 'user-123';

      const mockCheckIns = [
        {
          id: 'checkin-1',
          habitId,
          checkInDate: new Date('2026-01-15'),
          comment: null,
        },
        {
          id: 'checkin-2',
          habitId,
          checkInDate: new Date('2026-01-14'),
          comment: null,
        },
        {
          id: 'checkin-3',
          habitId,
          checkInDate: new Date('2026-01-13'),
          comment: null,
        },
      ];

      const mockHabit = {
        id: habitId,
        userId,
        name: 'Morning Run',
      };

      vi.mocked(prisma.habit.findFirst).mockResolvedValue(mockHabit as any);
      vi.mocked(prisma.habitCheckIn.findMany).mockResolvedValue(mockCheckIns as any);

      const result = await getCheckIns(habitId, userId);

      expect(result).toHaveLength(3);
    });

    it('should enforce user isolation when retrieving check-ins', async () => {
      const habitId = 'habit-1';
      const wrongUserId = 'user-456';

      vi.mocked(prisma.habit.findFirst).mockResolvedValue(null);

      await expect(getCheckIns(habitId, wrongUserId)).rejects.toThrow(
        'Habit not found'
      );
    });

    it('should return empty array if no check-ins exist', async () => {
      const habitId = 'habit-1';
      const userId = 'user-123';

      const mockHabit = { id: habitId, userId, name: 'Morning Run' };

      vi.mocked(prisma.habit.findFirst).mockResolvedValue(mockHabit as any);
      vi.mocked(prisma.habitCheckIn.findMany).mockResolvedValue([]);

      const result = await getCheckIns(habitId, userId);

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
          comment: null,
        },
        {
          id: 'checkin-2',
          habitId,
          checkInDate: new Date('2026-01-14'),
          comment: null,
        },
      ];

      const mockHabit = { id: habitId, userId, name: 'Morning Run' };

      vi.mocked(prisma.habit.findFirst).mockResolvedValue(mockHabit as any);
      vi.mocked(prisma.habitCheckIn.findMany).mockResolvedValue(mockCheckIns as any);

      const result = await getCheckIns(habitId, userId);

      expect(result[0].checkInDate.getTime()).toBeGreaterThan(
        result[1].checkInDate.getTime()
      );
    });
  });

  describe('Validation', () => {
    it('should validate habit exists before creating check-in', async () => {
      const habitId = 'habit-1';
      const userId = 'user-123';

      vi.mocked(prisma.habit.findFirst).mockResolvedValue(null);

      await expect(createCheckIn(habitId, userId, '2026-01-15')).rejects.toThrow(
        'Habit not found'
      );
    });
  });
});
