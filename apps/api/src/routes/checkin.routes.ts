import { Router } from 'express';
import { devAuthMiddleware } from '../middleware/dev-auth.js';
import * as checkinController from '../controllers/checkin.controller.js';

const router = Router({ mergeParams: true });

router.use(devAuthMiddleware);

router.post('/', checkinController.createCheckIn);
router.get('/', checkinController.listCheckIns);
router.delete('/:checkInId', checkinController.cancelCheckIn);

export default router;
