import { prisma } from '../lib/prisma.js';

export function calculateStreaks(dates: Date[]): { currentStreak: number; bestStreak: number } {
  if (dates.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  const sorted = dates.map((d) => new Date(d).getTime()).sort((a, b) => b - a);

  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 1;
  const dayMs = 24 * 60 * 60 * 1000;

  // Check if today or yesterday was checked in (current streak)
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const todayTime = today.getTime();
  const latestCheckIn = new Date(sorted[0]);
  const latestCheckInUTC = new Date(Date.UTC(latestCheckIn.getUTCFullYear(), latestCheckIn.getUTCMonth(), latestCheckIn.getUTCDate()));

  if (
    latestCheckInUTC.getTime() === todayTime ||
    latestCheckInUTC.getTime() === todayTime - dayMs
  ) {
    currentStreak = 1;

    // Count consecutive days backwards from yesterday
    for (let i = 1; i < sorted.length; i++) {
      const current = new Date(sorted[i - 1]);
      const next = new Date(sorted[i]);
      const currentUTC = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), current.getUTCDate()));
      const nextUTC = new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth(), next.getUTCDate()));

      if (currentUTC.getTime() - nextUTC.getTime() === dayMs) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Calculate best streak
  for (let i = 1; i < sorted.length; i++) {
    const current = new Date(sorted[i - 1]);
    const next = new Date(sorted[i]);
    const currentUTC = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), current.getUTCDate()));
    const nextUTC = new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth(), next.getUTCDate()));

    if (currentUTC.getTime() - nextUTC.getTime() === dayMs) {
      tempStreak++;
    } else {
      bestStreak = Math.max(bestStreak, tempStreak);
      tempStreak = 1;
    }
  }

  bestStreak = Math.max(bestStreak, tempStreak, currentStreak);

  return { currentStreak, bestStreak };
}

export async function getHabitCheckIns(habitId: string): Promise<Date[]> {
  const checkIns = await prisma.habitCheckIn.findMany({
    where: { habitId },
    select: { checkInDate: true },
  });

  return checkIns.map((ci) => new Date(ci.checkInDate));
}

export async function calculateCurrentStreak(habitId: string): Promise<number> {
  const dates = await getHabitCheckIns(habitId);
  const { currentStreak } = calculateStreaks(dates);
  return currentStreak;
}

export async function calculateBestStreak(habitId: string): Promise<number> {
  const dates = await getHabitCheckIns(habitId);
  const { bestStreak } = calculateStreaks(dates);
  return bestStreak;
}

export async function canCheckInToday(habitId: string): Promise<boolean> {
  const dates = await getHabitCheckIns(habitId);
  if (dates.length === 0) return true;

  const today = new Date();
  const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

  const latestCheckIn = new Date(Math.max(...dates.map((d) => d.getTime())));
  const latestCheckInUTC = new Date(Date.UTC(latestCheckIn.getUTCFullYear(), latestCheckIn.getUTCMonth(), latestCheckIn.getUTCDate()));

  return todayUTC.getTime() !== latestCheckInUTC.getTime();
}

export async function updateStreaks(habitId: string): Promise<void> {
  const dates = await getHabitCheckIns(habitId);
  const { currentStreak, bestStreak } = calculateStreaks(dates);

  await prisma.habit.update({
    where: { id: habitId },
    data: { currentStreak, bestStreak },
  });
}
