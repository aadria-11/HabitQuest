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
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();
  const latestCheckIn = new Date(sorted[0]);
  latestCheckIn.setHours(0, 0, 0, 0);

  if (
    latestCheckIn.getTime() === todayTime ||
    latestCheckIn.getTime() === todayTime - dayMs
  ) {
    currentStreak = 1;

    // Count consecutive days backwards from yesterday
    for (let i = 1; i < sorted.length; i++) {
      const current = new Date(sorted[i - 1]);
      const next = new Date(sorted[i]);
      current.setHours(0, 0, 0, 0);
      next.setHours(0, 0, 0, 0);

      if (current.getTime() - next.getTime() === dayMs) {
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
    current.setHours(0, 0, 0, 0);
    next.setHours(0, 0, 0, 0);

    if (current.getTime() - next.getTime() === dayMs) {
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
