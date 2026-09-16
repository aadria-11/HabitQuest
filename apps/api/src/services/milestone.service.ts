import { prisma } from '../lib/prisma.js';
import { Server as SocketIOServer } from 'socket.io';

const MILESTONES = [3, 7, 30];

export async function getMilestoneNotifications(
  userId: string,
  filters?: { acknowledged?: boolean }
) {
  return prisma.milestoneNotification.findMany({
    where: {
      userId,
      acknowledged: filters?.acknowledged ?? false,
    },
    include: {
      habit: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function evaluateMilestones(
  userId: string,
  io: SocketIOServer,
) {
  const habits = await prisma.habit.findMany({
    where: {
      userId,
      status: 'ACTIVE',
    },
  });

  for (const habit of habits) {
    // Clean up notifications for milestones that are no longer relevant
    await prisma.milestoneNotification.deleteMany({
      where: {
        habitId: habit.id,
        milestone: {
          gt: habit.currentStreak,
        },
      },
    });

    for (const milestone of MILESTONES) {
      if (habit.currentStreak !== milestone) {
        continue;
      }

      const { isNew, notificationId } = await prisma.$transaction(async (tx) => {
        const existing = await tx.milestoneNotification.findFirst({
          where: {
            habitId: habit.id,
            milestone,
          },
        });

        if (existing) {
          return { isNew: false, notificationId: existing.id };
        }

        const notification = await tx.milestoneNotification.create({
          data: {
            userId,
            habitId: habit.id,
            milestone,
          },
        });

        return { isNew: true, notificationId: notification.id };
      });

      if (isNew) {
        io.to(`user:${userId}`).emit('milestone', {
          notificationId,
          habitId: habit.id,
          habitName: habit.name,
          milestone,
        });
      }
    }
  }
}