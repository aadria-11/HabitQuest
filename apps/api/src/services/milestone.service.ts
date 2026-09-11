import { prisma } from '../lib/prisma.js';
import { Socket } from 'socket.io';

const MILESTONES = [3, 7, 30];

export async function evaluateMilestones(
  userId: string,
  socket: Socket,
) {
  const habits = await prisma.habit.findMany({
    where: {
      userId,
      status: 'ACTIVE',
    },
  });

  for (const habit of habits) {
    for (const milestone of MILESTONES) {
      if (habit.currentStreak !== milestone) {
        continue;
      }

      const existing =
        await prisma.milestoneNotification.findUnique({
          where: {
            habitId_milestone: {
              habitId: habit.id,
              milestone,
            },
          },
        });

      if (existing) {
        continue;
      }

      const notification =
        await prisma.milestoneNotification.create({
          data: {
            userId,
            habitId: habit.id,
            milestone,
          },
        });

      socket.emit('milestone', {
        notificationId: notification.id,
        habitId: habit.id,
        habitName: habit.name,
        milestone,
      });
    }
  }
}