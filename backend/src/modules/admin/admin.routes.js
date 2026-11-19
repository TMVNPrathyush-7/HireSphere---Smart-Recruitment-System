import { Router } from 'express';
import { AdminController } from './admin.controller.js';
import { authenticate, requireRole } from '../../common/middleware/auth.js';

const router = Router();

router.use(authenticate, requireRole(['admin']));

router.get('/users', AdminController.getUsers);
router.put('/users/:id/suspend', AdminController.toggleStatus);
router.delete('/users/:id', AdminController.deleteUser);

router.get('/jobs', AdminController.getJobs);
router.put('/jobs/:id/moderate', AdminController.moderateJob);

router.get('/analytics/summary', AdminController.getAnalytics);
router.get('/audit-logs', AdminController.getAuditLogs);

export default router;
