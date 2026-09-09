import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import * as checkinController from '../controllers/checkin.controller.js';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.post('/', checkinController.createCheckIn);
router.get('/', checkinController.listCheckIns);

export default router;
