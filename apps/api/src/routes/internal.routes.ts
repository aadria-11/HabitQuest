import { Router, Request, Response } from 'express';
import { internalAuthMiddleware } from '../middleware/auth.js';
import { syncUser } from '../services/user.service.js';
import { SyncUserSchema } from '@shared/schemas';

const router = Router();

router.post('/users/sync', internalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const parsed = SyncUserSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.errors });
    }

    const user = await syncUser(parsed.data);
    res.json({ userId: user.id });
  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
