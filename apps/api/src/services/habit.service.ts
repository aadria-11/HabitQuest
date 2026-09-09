import { prisma } from '../lib/prisma.js';
import { Habit, HabitStatus } from '@shared/types';
import { CreateHabit, UpdateHabit } from '@shared/schemas';

export async function createHabit(
  userId: string,
  data: CreateHabit,
): Promise<Habit> {
  return prisma.habit.create({
    data: {
      userId,
      name: data.name,
      description: data.description,
      startDate: new Date(data.startDate),
      status: (data.status as any) || 'ACTIVE',
    },
  });
}

export async function getHabits(
  userId: string,
  options: {
    search?: string;
    status?: HabitStatus;
    sortBy?: 'createdAt' | 'name';
    sortDir?: 'asc' | 'desc';
    skip?: number;
    take?: number;
  },
): Promise<{ habits: Habit[]; total: number }> {
  const where: any = { userId };

  if (options.search) {
    where.OR = [
      { name: { contains: options.search, mode: 'insensitive' } },
      { description: { contains: options.search, mode: 'insensitive' } },
    ];
  }

  if (options.status) {
    where.status = options.status;
  }

  const orderBy: any = {};
  const sortBy = options.sortBy || 'createdAt';
  const sortDir = options.sortDir || 'desc';
  orderBy[sortBy] = sortDir;

  const [habits, total] = await Promise.all([
    prisma.habit.findMany({
      where,
      orderBy,
      skip: options.skip || 0,
      take: options.take || 10,
    }),
    prisma.habit.count({ where }),
  ]);

  return { habits, total };
}

export async function getHabit(userId: string, habitId: string): Promise<Habit | null> {
  return prisma.habit.findFirst({
    where: { id: habitId, userId },
  });
}

export async function updateHabit(
  userId: string,
  habitId: string,
  data: UpdateHabit,
): Promise<Habit | null> {
  const habit = await getHabit(userId, habitId);
  if (!habit) return null;

  const updateData: any = {};
  if (data.name) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.startDate) updateData.startDate = new Date(data.startDate);
  if (data.status) updateData.status = data.status;

  return prisma.habit.update({
    where: { id: habitId },
    data: updateData,
  });
}

export async function deleteHabit(userId: string, habitId: string): Promise<boolean> {
  const habit = await getHabit(userId, habitId);
  if (!habit) return false;

  await prisma.habit.delete({
    where: { id: habitId },
  });

  return true;
}

export async function updateHabitStreaks(
  habitId: string,
  currentStreak: number,
  bestStreak: number,
): Promise<void> {
  await prisma.habit.update({
    where: { id: habitId },
    data: { currentStreak, bestStreak },
  });
}
