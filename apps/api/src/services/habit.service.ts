import { prisma } from '../lib/prisma.js';
import { Habit, HabitStatus, HabitUpdatedEvent, HabitDeletedEvent, HabitCreatedEvent } from '@shared/types';
import { CreateHabit, UpdateHabit } from '@shared/schemas';
import { getSocketIO } from '../sockets/index.js';

export async function createHabit(
  userId: string,
  data: CreateHabit,
): Promise<Habit> {
  const habit = await prisma.habit.create({
    data: {
      userId,
      name: data.name,
      description: data.description,
      startDate: new Date(data.startDate),
      status: (data.status as any) || 'ACTIVE',
    },
  });

  const io = getSocketIO();
  if (io) {
    const event: HabitCreatedEvent = { type: 'habit:created', data: habit };
    io.to(`user:${userId}`).emit('habit:created', event.data);
  }

  return habit;
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

  const updated = await prisma.habit.update({
    where: { id: habitId },
    data: updateData,
  });

  const io = getSocketIO();
  if (io) {
    const event: HabitUpdatedEvent = { type: 'habit:updated', data: updated };
    io.to(`user:${userId}`).emit('habit:updated', event.data);
  }

  return updated;
}

export async function deleteHabit(userId: string, habitId: string): Promise<boolean> {
  const habit = await getHabit(userId, habitId);
  if (!habit) return false;

  await prisma.habit.delete({
    where: { id: habitId },
  });

  const io = getSocketIO();
  if (io) {
    const event: HabitDeletedEvent = { type: 'habit:deleted', habitId };
    io.to(`user:${userId}`).emit('habit:deleted', habitId);
  }

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
