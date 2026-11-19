import { NotificationsService } from './notifications.service.js';
import { EmailService } from '../../common/services/email.service.js';

export class NotificationsController {
  static getMine(req, res) {
    try {
      const list = NotificationsService.getUserNotifications(req.user.id);
      return res.status(200).json(list);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  static markRead(req, res) {
    try {
      const result = NotificationsService.markAsRead(req.params.id, req.user.id);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  static markAllRead(req, res) {
    try {
      const result = NotificationsService.markAllAsRead(req.user.id);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  static getEmailLogs(req, res) {
    try {
      const logs = EmailService.getRecentLogs(30);
      return res.status(200).json(logs);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
}
