import { Router, Request, Response } from 'express';
import { internalAuthMiddleware } from '../middleware/auth.js';
import { syncUser } from '../services/user.service.js';

const router = Router();

router.post('/users/sync', internalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { email, name, image } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'email is required' });
    }

    const user = await syncUser(email, name, image);
    res.json({ userId: user.id });
  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
