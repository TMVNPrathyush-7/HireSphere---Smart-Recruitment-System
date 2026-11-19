import { AdminService } from './admin.service.js';

export class AdminController {
  static getUsers(req, res) {
    try {
      const users = AdminService.getAllUsers();
      return res.status(200).json(users);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  static toggleStatus(req, res) {
    try {
      const { is_active } = req.body;
      const result = AdminService.toggleUserStatus(req.params.id, is_active, req.user);
      return res.status(200).json({ message: 'User status updated', ...result });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  static deleteUser(req, res) {
    try {
      const result = AdminService.deleteUser(req.params.id, req.user);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  static getJobs(req, res) {
    try {
      const jobs = AdminService.getAllJobsForModeration();
      return res.status(200).json(jobs);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  static moderateJob(req, res) {
    try {
      const result = AdminService.moderateJob(req.params.id, req.body, req.user);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  static getAnalytics(req, res) {
    try {
      const data = AdminService.getAnalyticsSummary();
      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  static getAuditLogs(req, res) {
    try {
      const logs = AdminService.getAuditLogs();
      return res.status(200).json(logs);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
}
