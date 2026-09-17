import { prisma } from '../lib/prisma.js';
import { calculateStreaks } from './streak.service.js';
import { getSocketIO } from '../sockets/index.js';

export async function createCheckIn(habitId: string, userId: string, checkInDate: string, comment?: string) {
  // Verify habit belongs to user
  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId },
  });

  if (!habit) {
    throw new Error('Habit not found');
  }

  // Only active habits can be checked in
  if (habit.status !== 'ACTIVE') {
    const error = new Error('Habit is not active');
    (error as any).code = 'HABIT_NOT_ACTIVE';
    throw error;
  }

  // Parse the date (expecting YYYY-MM-DD); new Date() parses date-only strings as UTC midnight.
  const date = new Date(checkInDate);

  // Check if check-in already exists for this date
  const existing = await prisma.habitCheckIn.findUnique({
    where: {
      habitId_checkInDate: {
        habitId,
        checkInDate: date,
      },
    },
  });

  if (existing) {
    const error = new Error('Already checked in today');
    (error as any).code = 'DUPLICATE_CHECKIN';
    throw error;
  }

  // Create check-in and recalculate streaks in a transaction
  const checkIn = await prisma.$transaction(async (tx) => {
    const checkIn = await tx.habitCheckIn.create({
      data: {
        habitId,
        checkInDate: date,
        comment: comment || null,
      },
    });

    // Fetch all check-ins (including the new one)
    const allCheckIns = await tx.habitCheckIn.findMany({
      where: { habitId },
      select: { checkInDate: true },
    });

    const dates = allCheckIns.map((ci) => new Date(ci.checkInDate));
    const { currentStreak, bestStreak } = calculateStreaks(dates);

    // Update habit with new streaks
    await tx.habit.update({
      where: { id: habitId },
      data: { currentStreak, bestStreak },
    });

    return { checkIn, currentStreak, bestStreak };
  });

  // Emit WebSocket events
  const io = getSocketIO();
  if (io) {
    io.to(`user:${userId}`).emit('habit:checkedin', { habitId, checkInDate: date });
    io.to(`user:${userId}`).emit('streak:updated', {
      habitId,
      currentStreak: checkIn.currentStreak,
      bestStreak: checkIn.bestStreak,
    });
  }

  return checkIn.checkIn;
}

export async function getCheckIns(habitId: string, userId: string) {
  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId },
  });

  if (!habit) {
    throw new Error('Habit not found');
  }

  return prisma.habitCheckIn.findMany({
    where: { habitId },
    orderBy: { checkInDate: 'desc' },
  });
}

export async function cancelCheckIn(habitId: string, userId: string, checkInId: string) {
  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId },
  });

  if (!habit) {
    throw new Error('Habit not found');
  }

  // Archived habits are read-only
  if (habit.status === 'ARCHIVED') {
    const error = new Error('Habit is archived');
    (error as any).code = 'HABIT_ARCHIVED';
    throw error;
  }

  const existing = await prisma.habitCheckIn.findFirst({
    where: { id: checkInId, habitId },
  });

  if (!existing) {
    throw new Error('Check-in not found');
  }

  const { currentStreak, bestStreak } = await prisma.$transaction(async (tx) => {
    await tx.habitCheckIn.delete({ where: { id: checkInId } });

    const remaining = await tx.habitCheckIn.findMany({
      where: { habitId },
      select: { checkInDate: true },
    });

    const streaks = calculateStreaks(remaining.map((ci) => new Date(ci.checkInDate)));

    await tx.habit.update({
      where: { id: habitId },
      data: { currentStreak: streaks.currentStreak, bestStreak: streaks.bestStreak },
    });

    return streaks;
  });

  const io = getSocketIO();
  if (io) {
    io.to(`user:${userId}`).emit('checkin:cancelled', { habitId, checkInId });
    io.to(`user:${userId}`).emit('streak:updated', {
      habitId,
      currentStreak,
      bestStreak,
    });
  }
}

export async function getCheckInHistory(habitId: string, userId: string) {
  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId },
  });

  if (!habit) {
    throw new Error('Unauthorized');
  }

  return getCheckIns(habitId, userId);
}

export async function getCheckInsByDate(habitId: string, userId: string, date: string) {
  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId },
  });

  if (!habit) {
    throw new Error('Unauthorized');
  }

  const checkInDate = new Date(date);

  return prisma.habitCheckIn.findMany({
    where: { habitId, checkInDate },
    orderBy: { createdAt: 'desc' },
  });
}
