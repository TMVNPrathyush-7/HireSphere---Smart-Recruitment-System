import { db } from '../../common/database/index.js';

export class NotificationsService {
  static getUserNotifications(userId) {
    return db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30').all(userId);
  }

  static markAsRead(notificationId, userId) {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(notificationId, userId);
    return { success: true };
  }

  static markAllAsRead(userId) {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(userId);
    return { success: true };
  }
}
