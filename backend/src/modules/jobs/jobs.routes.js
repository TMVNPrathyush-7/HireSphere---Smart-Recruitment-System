import { Router } from 'express';
import { JobsController } from './jobs.controller.js';
import { authenticate, requireRole } from '../../common/middleware/auth.js';

const router = Router();

// Publicly browseable jobs
router.get('/', JobsController.getAll);
router.get('/:id', JobsController.getById);

// Recruiter jobs
router.get('/recruiter/:recruiterId', authenticate, JobsController.getRecruiterJobs);

// Protected job mutations
router.post('/', authenticate, requireRole(['recruiter', 'admin']), JobsController.create);
router.put('/:id', authenticate, requireRole(['recruiter', 'admin']), JobsController.update);
router.delete('/:id', authenticate, requireRole(['recruiter', 'admin']), JobsController.delete);

export default router;
