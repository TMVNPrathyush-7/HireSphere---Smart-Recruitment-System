import { v4 as uuidv4 } from 'uuid';
import { db } from '../../common/database/index.js';

export class JobsService {
  static createJob(data, user) {
    let recruiterProfile = db.prepare('SELECT id FROM recruiter_profiles WHERE user_id = ?').get(user.id);
    if (!recruiterProfile) {
      throw new Error('Recruiter profile not found for user');
    }

    const {
      title,
      description,
      required_skills = [],
      experience_level = 'Mid-Level',
      location = 'Remote',
      employment_type = 'full-time',
      deadline,
      status = 'open'
    } = data;

    if (!title || !description) {
      throw new Error('Job title and description are required');
    }

    const defaultDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const jobDeadline = (deadline && typeof deadline === 'string' && deadline.trim()) ? deadline.trim() : defaultDeadline;

    const jobId = uuidv4();
    const now = new Date().toISOString();
    const skillsJson = JSON.stringify(Array.isArray(required_skills) ? required_skills : [required_skills]);

    db.prepare(`
      INSERT INTO jobs (id, recruiter_id, title, description, required_skills, experience_level, location, employment_type, deadline, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(jobId, recruiterProfile.id, title.trim(), description.trim(), skillsJson, experience_level, location, employment_type, jobDeadline, status, now, now);

    return this.getJobById(jobId);
  }

  static getJobs({ search, location, skill, experience_level, status = 'open' } = {}) {
    let query = `
      SELECT j.*, rp.company_name, rp.company_website, rp.industry, rp.company_size,
        (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) as applicant_count
      FROM jobs j
      JOIN recruiter_profiles rp ON j.recruiter_id = rp.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      query += ' AND j.status = ?';
      params.push(status);
    }

    if (location) {
      query += ' AND LOWER(j.location) LIKE ?';
      params.push(`%${location.toLowerCase().trim()}%`);
    }

    if (experience_level) {
      query += ' AND LOWER(j.experience_level) LIKE ?';
      params.push(`%${experience_level.toLowerCase().trim()}%`);
    }

    if (search) {
      query += ' AND (LOWER(j.title) LIKE ? OR LOWER(j.description) LIKE ? OR LOWER(rp.company_name) LIKE ?)';
      const s = `%${search.toLowerCase().trim()}%`;
      params.push(s, s, s);
    }

    query += ' ORDER BY j.created_at DESC';

    const jobs = db.prepare(query).all(...params);

    return jobs.map(j => {
      try {
        j.required_skills = JSON.parse(j.required_skills || '[]');
      } catch (e) {
        j.required_skills = [];
      }
      return j;
    }).filter(j => {
      if (!skill) return true;
      const targetSkill = skill.toLowerCase();
      return j.required_skills.some(s => s.toLowerCase().includes(targetSkill));
    });
  }

  static getJobById(id) {
    const job = db.prepare(`
      SELECT j.*, rp.company_name, rp.company_website, rp.industry, rp.company_size, rp.user_id as recruiter_user_id,
        (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) as applicant_count
      FROM jobs j
      JOIN recruiter_profiles rp ON j.recruiter_id = rp.id
      WHERE j.id = ?
    `).get(id);

    if (!job) {
      throw new Error('Job posting not found');
    }

    try {
      job.required_skills = JSON.parse(job.required_skills || '[]');
    } catch (e) {
      job.required_skills = [];
    }

    return job;
  }

  static updateJob(id, data, user) {
    const job = db.prepare(`
      SELECT j.*, rp.user_id as recruiter_user_id
      FROM jobs j
      JOIN recruiter_profiles rp ON j.recruiter_id = rp.id
      WHERE j.id = ?
    `).get(id);

    if (!job) {
      throw new Error('Job not found');
    }

    if (user.role !== 'admin' && job.recruiter_user_id !== user.id) {
      throw new Error('Unauthorized to modify this job');
    }

    const title = data.title !== undefined ? data.title.trim() : job.title;
    const description = data.description !== undefined ? data.description.trim() : job.description;
    const requiredSkills = data.required_skills !== undefined ? JSON.stringify(data.required_skills) : job.required_skills;
    const experienceLevel = data.experience_level !== undefined ? data.experience_level : job.experience_level;
    const location = data.location !== undefined ? data.location : job.location;
    const employmentType = data.employment_type !== undefined ? data.employment_type : job.employment_type;
    const deadline = data.deadline !== undefined ? data.deadline : job.deadline;
    const status = data.status !== undefined ? data.status : job.status;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE jobs
      SET title = ?, description = ?, required_skills = ?, experience_level = ?, location = ?, employment_type = ?, deadline = ?, status = ?, updated_at = ?
      WHERE id = ?
    `).run(title, description, requiredSkills, experienceLevel, location, employmentType, deadline, status, now, id);

    return this.getJobById(id);
  }

  static deleteJob(id, user) {
    const job = db.prepare(`
      SELECT j.*, rp.user_id as recruiter_user_id
      FROM jobs j
      JOIN recruiter_profiles rp ON j.recruiter_id = rp.id
      WHERE j.id = ?
    `).get(id);

    if (!job) {
      throw new Error('Job not found');
    }

    if (user.role !== 'admin' && job.recruiter_user_id !== user.id) {
      throw new Error('Unauthorized to delete this job');
    }

    db.prepare('DELETE FROM jobs WHERE id = ?').run(id);
    return { success: true, message: 'Job deleted successfully' };
  }

  static getRecruiterJobs(recruiterIdOrUserId) {
    let recruiterProfile = db.prepare('SELECT id FROM recruiter_profiles WHERE id = ? OR user_id = ?').get(recruiterIdOrUserId, recruiterIdOrUserId);
    if (!recruiterProfile) {
      return [];
    }

    const jobs = db.prepare(`
      SELECT j.*,
        (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) as applicant_count,
        (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id AND a.status = 'shortlisted') as shortlisted_count,
        (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id AND a.status = 'interview_scheduled') as interview_count
      FROM jobs j
      WHERE j.recruiter_id = ?
      ORDER BY j.created_at DESC
    `).all(recruiterProfile.id);

    return jobs.map(j => {
      try {
        j.required_skills = JSON.parse(j.required_skills || '[]');
      } catch (e) {
        j.required_skills = [];
      }
      return j;
    });
  }
}
