import { v4 as uuidv4 } from 'uuid';
import { db } from '../../common/database/index.js';

export class AdminService {
  static getAllUsers() {
    const users = db.prepare(`
      SELECT u.id, u.email, u.role, u.full_name, u.phone, u.is_active, u.created_at,
        cp.headline, cp.years_experience,
        rp.company_name, rp.industry
      FROM users u
      LEFT JOIN candidate_profiles cp ON u.id = cp.user_id
      LEFT JOIN recruiter_profiles rp ON u.id = rp.user_id
      ORDER BY u.created_at DESC
    `).all();

    return users;
  }

  static toggleUserStatus(userId, is_active, adminUser) {
    const user = db.prepare('SELECT id, email, full_name, is_active FROM users WHERE id = ?').get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const newStatus = is_active !== undefined ? (is_active ? 1 : 0) : (user.is_active ? 0 : 1);
    const now = new Date().toISOString();

    db.prepare('UPDATE users SET is_active = ?, updated_at = ? WHERE id = ?').run(newStatus, now, userId);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, actor_user_id, action, target_type, target_id, metadata, created_at)
      VALUES (?, ?, ?, 'USER', ?, ?, ?)
    `).run(
      uuidv4(),
      adminUser.id,
      newStatus === 1 ? 'ACTIVATE_USER' : 'SUSPEND_USER',
      userId,
      JSON.stringify({ target_email: user.email }),
      now
    );

    return { id: userId, is_active: newStatus };
  }

  static deleteUser(userId, adminUser) {
    const user = db.prepare('SELECT id, email FROM users WHERE id = ?').get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(userId);

    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO audit_logs (id, actor_user_id, action, target_type, target_id, metadata, created_at)
      VALUES (?, ?, 'DELETE_USER', 'USER', ?, ?, ?)
    `).run(uuidv4(), adminUser.id, userId, JSON.stringify({ email: user.email }), now);

    return { success: true, message: 'User deleted' };
  }

  static getAllJobsForModeration() {
    const jobs = db.prepare(`
      SELECT j.*, rp.company_name, rp.company_website, u.full_name as recruiter_name, u.email as recruiter_email,
        (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) as applicant_count
      FROM jobs j
      JOIN recruiter_profiles rp ON j.recruiter_id = rp.id
      JOIN users u ON rp.user_id = u.id
      ORDER BY j.created_at DESC
    `).all();

    return jobs.map(j => {
      try {
        j.required_skills = JSON.parse(j.required_skills || '[]');
      } catch (e) {}
      return j;
    });
  }

  static moderateJob(jobId, { status }, adminUser) {
    const job = db.prepare('SELECT id, title FROM jobs WHERE id = ?').get(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    const now = new Date().toISOString();
    db.prepare('UPDATE jobs SET status = ?, updated_at = ? WHERE id = ?').run(status, now, jobId);

    db.prepare(`
      INSERT INTO audit_logs (id, actor_user_id, action, target_type, target_id, metadata, created_at)
      VALUES (?, ?, 'MODERATE_JOB', 'JOB', ?, ?, ?)
    `).run(uuidv4(), adminUser.id, jobId, JSON.stringify({ new_status: status, job_title: job.title }), now);

    return { success: true, message: `Job status updated to ${status}` };
  }

  static getAnalyticsSummary() {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const totalCandidates = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'candidate'").get().count;
    const totalRecruiters = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'recruiter'").get().count;
    const totalJobs = db.prepare('SELECT COUNT(*) as count FROM jobs').get().count;
    const openJobs = db.prepare("SELECT COUNT(*) as count FROM jobs WHERE status = 'open'").get().count;
    const totalApplications = db.prepare('SELECT COUNT(*) as count FROM applications').get().count;
    const shortlistedCount = db.prepare("SELECT COUNT(*) as count FROM applications WHERE status = 'shortlisted'").get().count;
    const interviewsScheduled = db.prepare("SELECT COUNT(*) as count FROM applications WHERE status = 'interview_scheduled'").get().count;
    const hiredCount = db.prepare("SELECT COUNT(*) as count FROM applications WHERE status = 'hired'").get().count;

    const avgAts = db.prepare('SELECT AVG(ats_score) as avg FROM applications').get().avg || 0;
    const avgSkillMatch = db.prepare('SELECT AVG(skill_match_score) as avg FROM applications').get().avg || 0;

    const recentApplications = db.prepare(`
      SELECT a.id, a.applied_at, a.status, a.ats_score, a.skill_match_score,
        j.title as job_title, rp.company_name, u.full_name as candidate_name
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN recruiter_profiles rp ON j.recruiter_id = rp.id
      JOIN candidate_profiles cp ON a.candidate_id = cp.id
      JOIN users u ON cp.user_id = u.id
      ORDER BY a.applied_at DESC
      LIMIT 6
    `).all();

    return {
      overview: {
        total_users: totalUsers,
        total_candidates: totalCandidates,
        total_recruiters: totalRecruiters,
        total_jobs: totalJobs,
        open_jobs: openJobs,
        total_applications: totalApplications,
        shortlisted_applications: shortlistedCount,
        interviews_scheduled: interviewsScheduled,
        hired_count: hiredCount,
        average_ats_score: Math.round(avgAts),
        average_skill_match: Math.round(avgSkillMatch)
      },
      recent_applications: recentApplications
    };
  }

  static getAuditLogs() {
    const logs = db.prepare(`
      SELECT al.*, u.full_name as actor_name, u.email as actor_email
      FROM audit_logs al
      LEFT JOIN users u ON al.actor_user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 50
    `).all();

    return logs.map(l => {
      try {
        l.metadata = JSON.parse(l.metadata || '{}');
      } catch (e) {}
      return l;
    });
  }
}
