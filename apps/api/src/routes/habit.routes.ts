import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import * as habitController from '../controllers/habit.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/', habitController.listHabits);
router.post('/', habitController.createHabit);
router.get('/:id', habitController.getHabit);
router.put('/:id', habitController.updateHabit);
router.delete('/:id', habitController.deleteHabit);

export default router;
