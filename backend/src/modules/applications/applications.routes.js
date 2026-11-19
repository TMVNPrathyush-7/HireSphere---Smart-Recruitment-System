import { Router } from 'express';
import { ApplicationsController } from './applications.controller.js';
import { authenticate, requireRole } from '../../common/middleware/auth.js';

const router = Router();

router.post('/', authenticate, requireRole(['candidate']), ApplicationsController.apply);
router.get('/job/:jobId', authenticate, requireRole(['recruiter', 'admin']), ApplicationsController.getJobApplications);
router.get('/candidate/:candidateId', authenticate, ApplicationsController.getCandidateApplications);
router.put('/:id/status', authenticate, requireRole(['recruiter', 'admin']), ApplicationsController.updateStatus);

export default router;
