import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@shared/types';
import { CheckInSchema } from '@shared/schemas';
import * as checkinService from '../services/checkin.service.js';

export async function createCheckIn(
  req: Request & AuthenticatedRequest,
  res: Response,
) {
  try {
    const { id } = req.params;

    const parsed = CheckInSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors });
    }

    const checkIn = await checkinService.createCheckIn(
      id,
      req.user.userId,
      parsed.data.checkInDate,
      parsed.data.comment,
    );

    res.status(201).json(checkIn);
  } catch (error: any) {
    if (error.code === 'DUPLICATE_CHECKIN') {
      return res.status(409).json({ error: 'Already checked in today' });
    }

    if (error.code === 'HABIT_NOT_ACTIVE') {
      return res.status(403).json({ error: 'Only active habits can be checked in' });
    }

    if (error.message === 'Habit not found') {
      return res.status(404).json({ error: 'Habit not found' });
    }

    console.error('Error creating check-in:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function listCheckIns(
  req: Request & AuthenticatedRequest,
  res: Response,
) {
  try {
    const { id } = req.params;

    const checkIns = await checkinService.getCheckIns(id, req.user.userId);
    res.json(checkIns);
  } catch (error: any) {
    if (error.message === 'Habit not found') {
      return res.status(404).json({ error: 'Habit not found' });
    }

    console.error('Error listing check-ins:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function cancelCheckIn(
  req: Request & AuthenticatedRequest,
  res: Response,
) {
  try {
    const { id, checkInId } = req.params;

    await checkinService.cancelCheckIn(id, req.user.userId, checkInId);

    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'HABIT_ARCHIVED') {
      return res.status(403).json({ error: 'Archived habits are read-only' });
    }

    if (error.message === 'Habit not found') {
      return res.status(404).json({ error: 'Habit not found' });
    }
    if (error.message === 'Check-in not found') {
      return res.status(404).json({ error: 'Check-in not found' });
    }

    console.error('Error cancelling check-in:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
