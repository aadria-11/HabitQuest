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
      status: data.status || 'ACTIVE',
    },
  });

  const habitWithCount = {
    ...habit,
    checkInCount: 0,
    checkedInToday: false,
  } as Habit;

  const io = getSocketIO();
  if (io) {
    const event: HabitCreatedEvent = { type: 'habit:created', data: habitWithCount };
    io.to(`user:${userId}`).emit('habit:created', event.data);
  }

  return habitWithCount;
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
      select: {
        id: true,
        userId: true,
        name: true,
        description: true,
        startDate: true,
        status: true,
        currentStreak: true,
        bestStreak: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { checkIns: true },
        },
      },
    }),
    prisma.habit.count({ where }),
  ]);

  const habitIds = habits.map((h) => h.id);
  const today = new Date().toISOString().split('T')[0];
  const todaysCheckIns = await prisma.habitCheckIn.findMany({
    where: {
      habitId: { in: habitIds },
      checkInDate: new Date(today),
    },
    select: { habitId: true },
  });
  const checkedInTodayIds = new Set(todaysCheckIns.map((ci) => ci.habitId));

  const habitsWithCount = habits.map((habit) => ({
    ...habit,
    checkInCount: habit._count.checkIns,
    checkedInToday: checkedInTodayIds.has(habit.id),
    _count: undefined,
  })) as unknown as Habit[];

  return { habits: habitsWithCount, total };
}

export async function getHabit(userId: string, habitId: string): Promise<Habit | null> {
  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId },
    include: {
      checkIns: true,
    },
  });

  if (!habit) return null;

  const today = new Date().toISOString().split('T')[0];
  const todaysCheckIn = habit.checkIns.find(ci => ci.checkInDate.toISOString().split('T')[0] === today);

  return {
    ...habit,
    checkInCount: habit.checkIns.length,
    checkedInToday: !!todaysCheckIn,
    checkIns: undefined,
  } as unknown as Habit;
}

export async function updateHabit(
  userId: string,
  habitId: string,
  data: UpdateHabit,
): Promise<Habit | null> {
  const habit = await getHabit(userId, habitId);
  if (!habit) return null;

  // Archived habits are read-only
  if (habit.status === 'ARCHIVED') {
    const error = new Error('Habit is archived');
    (error as any).code = 'HABIT_ARCHIVED';
    throw error;
  }

  const updateData: any = {};
  if (data.name) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.startDate) updateData.startDate = new Date(data.startDate);
  if (data.status) updateData.status = data.status;

  const updated = await prisma.habit.update({
    where: { id: habitId },
    data: updateData,
  });

  const updatedWithCount = {
    ...updated,
    checkInCount: habit.checkInCount,
    checkedInToday: habit.checkedInToday,
  } as Habit;

  const io = getSocketIO();
  if (io) {
    const event: HabitUpdatedEvent = { type: 'habit:updated', data: updatedWithCount };
    io.to(`user:${userId}`).emit('habit:updated', event.data);
  }

  return updatedWithCount;
}

export async function deleteHabit(userId: string, habitId: string): Promise<boolean> {
  const habit = await getHabit(userId, habitId);
  if (!habit) return false;

  // Cascade delete: deleting a habit also removes all its check-ins and milestone notifications
  // (see prisma/schema.prisma: HabitCheckIn.habit and MilestoneNotification.habit both have onDelete: Cascade)
  await prisma.habit.delete({
    where: { id: habitId },
  });

  const io = getSocketIO();
  if (io) {
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
