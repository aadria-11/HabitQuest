import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@shared/types';
import { CreateHabitSchema, UpdateHabitSchema } from '@shared/schemas';
import * as habitService from '../services/habit.service.js';

export async function listHabits(
  req: Request & AuthenticatedRequest,
  res: Response,
) {
  try {
    const { search, status, sortBy, sortDir, page = '1', pageSize = '10' } = req.query;

    const { habits, total } = await habitService.getHabits(req.user.userId, {
      search: search as string | undefined,
      status: status as string | undefined,
      sortBy: (sortBy as any) || 'createdAt',
      sortDir: (sortDir as any) || 'desc',
      skip: (parseInt(page as string) - 1) * parseInt(pageSize as string),
      take: parseInt(pageSize as string),
    });

    res.json({
      data: habits,
      total,
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
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
  console.log('REQ USER:', req.user);
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
  } catch (error: any) {
    if (error.code === 'HABIT_ARCHIVED') {
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

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting habit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
