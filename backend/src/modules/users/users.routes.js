import { Router } from 'express';
import { UsersController } from './users.controller.js';
import { authenticate } from '../../common/middleware/auth.js';

const router = Router();

router.get('/candidates/:id', authenticate, UsersController.getCandidate);
router.put('/candidates/:id', authenticate, UsersController.updateCandidate);

router.get('/recruiters/:id', authenticate, UsersController.getRecruiter);
router.put('/recruiters/:id', authenticate, UsersController.updateRecruiter);

export default router;
