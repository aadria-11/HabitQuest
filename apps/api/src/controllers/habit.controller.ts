import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@shared/types';
import { CreateHabitSchema, UpdateHabitSchema, HabitListQuerySchema } from '@shared/schemas';
import * as habitService from '../services/habit.service.js';
import * as milestoneService from '../services/milestone.service.js';

export async function listHabits(
  req: Request & AuthenticatedRequest,
  res: Response,
) {
  try {
    const parsed = HabitListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors });
    }

    const { search, status, sortBy, sortDir, page, pageSize } = parsed.data;

    const { habits, total } = await habitService.getHabits(req.user.userId, {
      search,
      status,
      sortBy,
      sortDir,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    res.json({
      data: habits,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Error listing habits:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getHabit(
  req: Request & AuthenticatedRequest,
  res: Response,
) {
  try {
    const { id } = req.params;

    const habit = await habitService.getHabit(req.user.userId, id);
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    res.json(habit);
  } catch (error) {
    console.error('Error getting habit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}


export async function createHabit(
  req: Request & AuthenticatedRequest,
  res: Response,
) {
  try {
    const parsed = CreateHabitSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors });
    }

    const habit = await habitService.createHabit(req.user.userId, parsed.data);
    res.status(201).json(habit);
  } catch (error) {
    console.error('Error creating habit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateHabit(
  req: Request & AuthenticatedRequest,
  res: Response,
) {
  try {
    const { id } = req.params;

    const parsed = UpdateHabitSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors });
    }

    const habit = await habitService.updateHabit(req.user.userId, id, parsed.data);
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    res.json(habit);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'HABIT_ARCHIVED') {
      return res.status(403).json({ error: 'Archived habits are read-only and cannot be edited' });
    }

    console.error('Error updating habit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteHabit(
  req: Request & AuthenticatedRequest,
  res: Response,
) {
  try {
    const { id } = req.params;

    const success = await habitService.deleteHabit(req.user.userId, id);
    if (!success) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting habit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getMilestoneNotifications(
  req: Request & AuthenticatedRequest,
  res: Response,
) {
  try {
    const notifications = await milestoneService.getMilestoneNotifications(req.user.userId);
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching milestone notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function acknowledgeMilestoneNotification(
  req: Request & AuthenticatedRequest,
  res: Response,
) {
  try {
    const { notificationId } = req.params;
    const { prisma } = await import('../lib/prisma.js');

    const notification = await prisma.milestoneNotification.findFirst({
      where: {
        id: notificationId,
        userId: req.user.userId,
      },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await prisma.milestoneNotification.update({
      where: { id: notificationId },
      data: { acknowledged: true },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error acknowledging notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
