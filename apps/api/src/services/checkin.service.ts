import { prisma } from '../lib/prisma.js';
import { calculateStreaks, getHabitCheckIns } from './streak.service.js';

export async function createCheckIn(habitId: string, userId: string, checkInDate: string) {
  // Verify habit belongs to user
  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId },
  });

  if (!habit) {
    throw new Error('Habit not found');
  }

  // Parse the date (expecting YYYY-MM-DD)
  const date = new Date(checkInDate);
  date.setHours(0, 0, 0, 0);

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
  return await prisma.$transaction(async (tx) => {
    const checkIn = await tx.habitCheckIn.create({
      data: {
        habitId,
        checkInDate: date,
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

    return checkIn;
  });
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
