import { Router } from 'express';
import { NotificationsController } from './notifications.controller.js';
import { authenticate } from '../../common/middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', NotificationsController.getMine);
router.get('/email-logs', NotificationsController.getEmailLogs);
router.put('/:id/read', NotificationsController.markRead);
router.put('/read-all', NotificationsController.markAllRead);

export default router;
