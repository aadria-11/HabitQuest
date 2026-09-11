import { Router } from 'express';
import { devAuthMiddleware } from '../middleware/dev-auth.js';
import * as habitController from '../controllers/habit.controller.js';

const router = Router();

router.use(devAuthMiddleware);

router.get('/', habitController.listHabits);
router.post('/', habitController.createHabit);
router.get('/:id', habitController.getHabit);
router.put('/:id', habitController.updateHabit);
router.delete('/:id', habitController.deleteHabit);

export default router;
