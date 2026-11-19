import { Router } from 'express';
import { InterviewsController } from './interviews.controller.js';
import { authenticate, requireRole } from '../../common/middleware/auth.js';

const router = Router();

router.post('/', authenticate, requireRole(['recruiter', 'admin']), InterviewsController.propose);
router.put('/:id/confirm', authenticate, InterviewsController.confirm);
router.get('/candidate/:candidateId', authenticate, InterviewsController.getCandidateInterviews);
router.get('/recruiter/:recruiterId', authenticate, InterviewsController.getRecruiterInterviews);

export default router;
