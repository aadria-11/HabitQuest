import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createHabit, updateHabit, deleteHabit, getHabitById, getUserHabits } from '@api/services/habit.service';
import { prisma } from '@api/lib/prisma';

// Mock Prisma
vi.mock('@api/lib/prisma', () => ({
  prisma: {
    habit: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe('Habit Service - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createHabit', () => {
    it('should create a habit with valid input', async () => {
      const habitData = {
        name: 'Morning Run',
        description: 'Run 5km every morning',
        startDate: new Date('2026-01-01'),
        status: 'active',
        userId: 'user-123',
      };

      const mockHabit = {
        id: 'habit-1',
        ...habitData,
        currentStreak: 0,
        bestStreak: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.habit.create).mockResolvedValue(mockHabit);

      const result = await createHabit(habitData);

      expect(result).toEqual(mockHabit);
      expect(prisma.habit.create).toHaveBeenCalledWith({
        data: habitData,
      });
    });

    it('should fail if required fields are missing', async () => {
      const incompleteData = {
        name: 'Morning Run',
        userId: 'user-123',
      };

      vi.mocked(prisma.habit.create).mockRejectedValue(
        new Error('Missing required fields')
      );

      await expect(createHabit(incompleteData as any)).rejects.toThrow(
        'Missing required fields'
      );
    });

    it('should enforce userId scoping', async () => {
      const habitData = {
        name: 'Meditation',
        description: 'Daily meditation',
        startDate: new Date(),
        status: 'active',
        userId: 'user-123',
      };

      await createHabit(habitData);

      expect(prisma.habit.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-123',
        }),
      });
    });
  });

  describe('updateHabit', () => {
    it('should update habit with valid data', async () => {
      const habitId = 'habit-1';
      const userId = 'user-123';
      const updateData = {
        name: 'Updated Run',
        status: 'paused',
      };

      const mockUpdatedHabit = {
        id: habitId,
        name: 'Updated Run',
        description: 'Run 5km every morning',
        status: 'paused',
        userId,
        startDate: new Date(),
        currentStreak: 0,
        bestStreak: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.habit.update).mockResolvedValue(mockUpdatedHabit);

      const result = await updateHabit(habitId, userId, updateData);

      expect(result).toEqual(mockUpdatedHabit);
      expect(prisma.habit.update).toHaveBeenCalledWith({
        where: { id: habitId },
        data: updateData,
      });
    });

    it('should only allow users to update their own habits', async () => {
      const habitId = 'habit-1';
      const userId = 'user-123';
      const wrongUserId = 'user-456';

      vi.mocked(prisma.habit.update).mockRejectedValue(
        new Error('Unauthorized')
      );

      await expect(
        updateHabit(habitId, wrongUserId, { name: 'Hack' })
      ).rejects.toThrow('Unauthorized');
    });

    it('should not allow invalid status values', async () => {
      const habitId = 'habit-1';
      const userId = 'user-123';

      vi.mocked(prisma.habit.update).mockRejectedValue(
        new Error('Invalid status')
      );

      await expect(
        updateHabit(habitId, userId, { status: 'invalid' as any })
      ).rejects.toThrow('Invalid status');
    });
  });

  describe('deleteHabit', () => {
    it('should delete habit successfully', async () => {
      const habitId = 'habit-1';
      const userId = 'user-123';

      vi.mocked(prisma.habit.delete).mockResolvedValue({
        id: habitId,
        userId,
        name: 'Morning Run',
        description: 'Run 5km',
        status: 'active',
        startDate: new Date(),
        currentStreak: 0,
        bestStreak: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await deleteHabit(habitId, userId);

      expect(prisma.habit.delete).toHaveBeenCalledWith({
        where: { id: habitId },
      });
    });

    it('should prevent deleting another user\'s habit', async () => {
      const habitId = 'habit-1';
      const userId = 'user-123';
      const wrongUserId = 'user-456';

      vi.mocked(prisma.habit.delete).mockRejectedValue(
        new Error('Unauthorized')
      );

      await expect(deleteHabit(habitId, wrongUserId)).rejects.toThrow(
        'Unauthorized'
      );
    });
  });

  describe('getHabitById', () => {
    it('should retrieve habit by ID', async () => {
      const habitId = 'habit-1';
      const userId = 'user-123';

      const mockHabit = {
        id: habitId,
        userId,
        name: 'Morning Run',
        description: 'Run 5km daily',
        status: 'active',
        startDate: new Date(),
        currentStreak: 5,
        bestStreak: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.habit.findUnique).mockResolvedValue(mockHabit);

      const result = await getHabitById(habitId, userId);

      expect(result).toEqual(mockHabit);
    });

    it('should return null for non-existent habit', async () => {
      vi.mocked(prisma.habit.findUnique).mockResolvedValue(null);

      const result = await getHabitById('non-existent', 'user-123');

      expect(result).toBeNull();
    });

    it('should enforce userId scoping in retrieval', async () => {
      const habitId = 'habit-1';
      const userId = 'user-123';

      vi.mocked(prisma.habit.findUnique).mockResolvedValue(null);

      await getHabitById(habitId, userId);

      expect(prisma.habit.findUnique).toHaveBeenCalledWith({
        where: { id: habitId },
      });
    });
  });

  describe('getUserHabits', () => {
    it('should retrieve all habits for a user', async () => {
      const userId = 'user-123';

      const mockHabits = [
        {
          id: 'habit-1',
          userId,
          name: 'Morning Run',
          description: 'Run 5km',
          status: 'active',
          startDate: new Date(),
          currentStreak: 5,
          bestStreak: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'habit-2',
          userId,
          name: 'Meditation',
          description: 'Meditate 20min',
          status: 'active',
          startDate: new Date(),
          currentStreak: 3,
          bestStreak: 7,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.habit.findMany).mockResolvedValue(mockHabits);

      const result = await getUserHabits(userId);

      expect(result).toEqual(mockHabits);
      expect(prisma.habit.findMany).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should filter by status if provided', async () => {
      const userId = 'user-123';
      const status = 'active';

      const mockHabits = [
        {
          id: 'habit-1',
          userId,
          name: 'Morning Run',
          status: 'active',
          description: 'Run 5km',
          startDate: new Date(),
          currentStreak: 5,
          bestStreak: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.habit.findMany).mockResolvedValue(mockHabits);

      const result = await getUserHabits(userId, { status });

      expect(result).toEqual(mockHabits);
      expect(prisma.habit.findMany).toHaveBeenCalledWith({
        where: { userId, status },
      });
    });

    it('should return empty array if user has no habits', async () => {
      vi.mocked(prisma.habit.findMany).mockResolvedValue([]);

      const result = await getUserHabits('user-with-no-habits');

      expect(result).toEqual([]);
    });

    it('should enforce user isolation', async () => {
      const userId = 'user-123';

      await getUserHabits(userId);

      expect(prisma.habit.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId }),
        })
      );
    });
  });

  describe('Habit Status Values', () => {
    it('should only accept valid status values: active, paused, archived', async () => {
      const validStatuses = ['active', 'paused', 'archived'];
      const invalidStatuses = ['inactive', 'deleted', 'completed'];

      for (const status of invalidStatuses) {
        vi.mocked(prisma.habit.update).mockRejectedValue(
          new Error('Invalid status')
        );

        await expect(
          updateHabit('habit-1', 'user-123', { status: status as any })
        ).rejects.toThrow('Invalid status');
      }
    });
  });
});
