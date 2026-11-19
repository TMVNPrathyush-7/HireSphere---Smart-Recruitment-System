import { v4 as uuidv4 } from 'uuid';
import { db } from '../../common/database/index.js';
import { AiProxyService } from '../ai_proxy/ai_proxy.service.js';
import { EmailService } from '../../common/services/email.service.js';

export class ApplicationsService {
  static async applyToJob(jobId, user) {
    let candidate = db.prepare('SELECT * FROM candidate_profiles WHERE user_id = ?').get(user.id);
    if (!candidate) {
      throw new Error('Candidate profile not found. Please complete your profile first.');
    }

    const job = db.prepare(`
      SELECT j.*, rp.user_id as recruiter_user_id, rp.company_name
      FROM jobs j
      JOIN recruiter_profiles rp ON j.recruiter_id = rp.id
      WHERE j.id = ?
    `).get(jobId);

    if (!job) {
      throw new Error('Job not found');
    }

    if (job.status !== 'open') {
      throw new Error('This job posting is no longer accepting applications');
    }

    if (job.deadline) {
      const deadlineDate = new Date(job.deadline);
      // Allow applications until end of deadline date (23:59:59.999)
      deadlineDate.setHours(23, 59, 59, 999);
      if (new Date() > deadlineDate) {
        throw new Error('The application deadline for this position has passed');
      }
    }

    // Check if already applied
    const existing = db.prepare('SELECT id FROM applications WHERE job_id = ? AND candidate_id = ?').get(jobId, candidate.id);
    if (existing) {
      throw new Error('You have already applied for this position');
    }

    let parsedSkills = [];
    try {
      parsedSkills = JSON.parse(candidate.skills || '[]');
    } catch (e) {
      parsedSkills = [];
    }

    let reqSkills = [];
    try {
      reqSkills = JSON.parse(job.required_skills || '[]');
    } catch (e) {
      reqSkills = [];
    }

    let parsedResume = {};
    try {
      parsedResume = JSON.parse(candidate.parsed_resume_json || '{}');
    } catch (e) {
      parsedResume = {};
    }

    let parsedEdu = [];
    try {
      parsedEdu = JSON.parse(candidate.education || '[]');
    } catch (e) {}
    if (parsedEdu.length === 0 && Array.isArray(parsedResume.education)) {
      parsedEdu = parsedResume.education;
    }

    let parsedExp = [];
    try {
      parsedExp = JSON.parse(candidate.work_experience || '[]');
    } catch (e) {}
    if (parsedExp.length === 0 && Array.isArray(parsedResume.projects)) {
      parsedExp = parsedResume.projects;
    }

    const candidateProfilePayload = {
      ...candidate,
      email: user.email || parsedResume.email,
      phone: user.phone || parsedResume.phone,
      linkedin_url: parsedResume.linkedin_url,
      github_url: parsedResume.github_url,
      skills: parsedSkills.length ? parsedSkills : (parsedResume.skills || []),
      education: parsedEdu,
      work_experience: parsedExp,
      projects: parsedResume.projects || []
    };

    // Run AI scoring asynchronously or synchronously
    const atsResult = await AiProxyService.calculateAtsScore(
      candidateProfilePayload,
      { ...job, required_skills: reqSkills }
    );
    const skillResult = await AiProxyService.calculateSkillMatch(parsedSkills, reqSkills);

    const atsScore = atsResult?.ats_score || 75;
    const skillScore = skillResult?.match_percentage || 70;

    const applicationId = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO applications (id, job_id, candidate_id, resume_snapshot_url, ats_score, skill_match_score, rank_position, status, applied_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, 'applied', ?, ?)
    `).run(applicationId, jobId, candidate.id, candidate.resume_file_url || null, atsScore, skillScore, now, now);

    // Re-rank all applicants for this job
    await this.updateJobRanking(jobId);

    // Notify recruiter via in-app notification
    const notifId = uuidv4();
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, message, is_read, created_at)
      VALUES (?, ?, 'new_applicant', ?, 0, ?)
    `).run(
      notifId,
      job.recruiter_user_id,
      `New applicant ${user.full_name} applied for "${job.title}" (Skill Match: ${skillScore}%, ATS Compatibility: ${atsScore}%).`,
      now
    );

    // Notify candidate via in-app confirmation
    const candidateNotifId = uuidv4();
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, message, is_read, created_at)
      VALUES (?, ?, 'application_submitted', ?, 0, ?)
    `).run(
      candidateNotifId,
      user.id,
      `Application confirmed for "${job.title}" at ${job.company_name}. Tracking is now active.`,
      now
    );

    // Dispatch real/simulated emails via EmailService
    if (user.email) {
      EmailService.sendApplicationConfirmation({
        toEmail: user.email,
        candidateName: user.full_name,
        jobTitle: job.title,
        companyName: job.company_name,
        atsScore,
        skillMatchScore: skillScore
      }).catch(err => console.error('[EmailService] Candidate confirmation dispatch failed:', err.message));
    }

    const recruiterUser = db.prepare('SELECT email, full_name FROM users WHERE id = ?').get(job.recruiter_user_id);
    if (recruiterUser?.email) {
      EmailService.sendRecruiterNewApplicantAlert({
        toEmail: recruiterUser.email,
        recruiterName: recruiterUser.full_name,
        candidateName: user.full_name,
        jobTitle: job.title,
        atsScore,
        skillMatchScore: skillScore,
        applicationId
      }).catch(err => console.error('[EmailService] Recruiter alert dispatch failed:', err.message));
    }

    return this.getApplicationById(applicationId);
  }

  static async updateJobRanking(jobId) {
    const apps = db.prepare('SELECT id, ats_score, skill_match_score FROM applications WHERE job_id = ?').all(jobId);
    if (!apps.length) return;

    const ranked = await AiProxyService.rankCandidates(apps);

    const updateStmt = db.prepare('UPDATE applications SET rank_position = ? WHERE id = ?');
    for (const item of ranked) {
      updateStmt.run(item.rank_position, item.id);
    }
  }

  static getApplicationById(id) {
    const app = db.prepare(`
      SELECT a.*,
        j.title as job_title, j.location as job_location, j.employment_type, j.required_skills,
        rp.company_name, rp.company_website,
        cp.headline as candidate_headline, cp.skills as candidate_skills, cp.years_experience as candidate_years_experience,
        u.full_name as candidate_name, u.email as candidate_email, u.phone as candidate_phone
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN recruiter_profiles rp ON j.recruiter_id = rp.id
      JOIN candidate_profiles cp ON a.candidate_id = cp.id
      JOIN users u ON cp.user_id = u.id
      WHERE a.id = ?
    `).get(id);

    if (!app) {
      throw new Error('Application not found');
    }

    try {
      app.required_skills = JSON.parse(app.required_skills || '[]');
      app.candidate_skills = JSON.parse(app.candidate_skills || '[]');
    } catch (e) {
      // defaults
    }

    return app;
  }

  static getJobApplications(jobId, user) {
    const job = db.prepare(`
      SELECT j.id, rp.user_id as recruiter_user_id
      FROM jobs j
      JOIN recruiter_profiles rp ON j.recruiter_id = rp.id
      WHERE j.id = ?
    `).get(jobId);

    if (!job) {
      throw new Error('Job not found');
    }

    if (user.role !== 'admin' && job.recruiter_user_id !== user.id) {
      throw new Error('Unauthorized to view applicants for this job');
    }

    const apps = db.prepare(`
      SELECT a.*,
        cp.headline as candidate_headline, cp.skills as candidate_skills, cp.years_experience as candidate_years_experience,
        cp.education as candidate_education, cp.work_experience as candidate_work_experience, cp.resume_file_url,
        cp.parsed_resume_json,
        u.full_name as candidate_name, u.email as candidate_email, u.phone as candidate_phone,
        i.id as interview_id, i.status as interview_status, i.confirmed_slot, i.meeting_link
      FROM applications a
      JOIN candidate_profiles cp ON a.candidate_id = cp.id
      JOIN users u ON cp.user_id = u.id
      LEFT JOIN interviews i ON i.application_id = a.id
      WHERE a.job_id = ?
      ORDER BY a.rank_position ASC, (a.ats_score * 0.4 + a.skill_match_score * 0.6) DESC
    `).all(jobId);

    return apps.map(app => {
      try {
        app.candidate_skills = JSON.parse(app.candidate_skills || '[]');
        app.candidate_education = JSON.parse(app.candidate_education || '[]');
        app.candidate_work_experience = JSON.parse(app.candidate_work_experience || '[]');
      } catch (e) {
        // defaults
      }

      let parsedResume = {};
      try {
        parsedResume = JSON.parse(app.parsed_resume_json || '{}');
      } catch (e) {}

      app.candidate_projects = parsedResume.projects || [];
      app.candidate_linkedin = parsedResume.linkedin_url || null;
      app.candidate_github = parsedResume.github_url || null;
      app.candidate_portfolio = parsedResume.portfolio_url || null;
      app.candidate_summary = parsedResume.summary || parsedResume.experience_summary || null;

      if ((!app.candidate_education || app.candidate_education.length === 0) && Array.isArray(parsedResume.education)) {
        app.candidate_education = parsedResume.education;
      }
      app.composite_score = Math.round((app.ats_score * 0.4) + (app.skill_match_score * 0.6));
      return app;
    });
  }

  static getCandidateApplications(candidateIdOrUserId) {
    let candidate = db.prepare('SELECT id FROM candidate_profiles WHERE id = ? OR user_id = ?').get(candidateIdOrUserId, candidateIdOrUserId);
    if (!candidate) {
      return [];
    }

    const apps = db.prepare(`
      SELECT a.*,
        j.id as job_id, j.title as job_title, j.location as job_location, j.employment_type, j.required_skills,
        rp.company_name, rp.company_website, rp.industry,
        i.id as interview_id, i.status as interview_status, i.proposed_slots, i.confirmed_slot, i.meeting_link, i.notes as interview_notes
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN recruiter_profiles rp ON j.recruiter_id = rp.id
      LEFT JOIN interviews i ON i.application_id = a.id
      WHERE a.candidate_id = ?
      ORDER BY a.applied_at DESC
    `).all(candidate.id);

    return apps.map(app => {
      try {
        app.required_skills = JSON.parse(app.required_skills || '[]');
        if (app.proposed_slots) {
          app.proposed_slots = JSON.parse(app.proposed_slots);
        }
      } catch (e) {
        // defaults
      }
      app.composite_score = Math.round((app.ats_score * 0.4) + (app.skill_match_score * 0.6));
      return app;
    });
  }

  static updateApplicationStatus(id, status, user) {
    const validStatuses = ['applied', 'under_review', 'shortlisted', 'interview_scheduled', 'rejected', 'hired'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    const app = db.prepare(`
      SELECT a.*, j.title as job_title, rp.user_id as recruiter_user_id, rp.company_name, cp.user_id as candidate_user_id
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN recruiter_profiles rp ON j.recruiter_id = rp.id
      JOIN candidate_profiles cp ON a.candidate_id = cp.id
      WHERE a.id = ?
    `).get(id);

    if (!app) {
      throw new Error('Application not found');
    }

    if (user.role !== 'admin' && app.recruiter_user_id !== user.id) {
      throw new Error('Unauthorized to update this application status');
    }

    const now = new Date().toISOString();
    db.prepare('UPDATE applications SET status = ?, updated_at = ? WHERE id = ?').run(status, now, id);

    // Notify candidate of status update
    const notifId = uuidv4();
    const statusLabels = {
      under_review: 'is now Under Review',
      shortlisted: 'has been Shortlisted! 🎉',
      interview_scheduled: 'has an Interview Scheduled 📅',
      rejected: 'was not selected at this time',
      hired: 'has been Accepted! You received a Job Offer! 🏆'
    };

    const readableStatus = statusLabels[status] || `updated to ${status}`;

    db.prepare(`
      INSERT INTO notifications (id, user_id, type, message, is_read, created_at)
      VALUES (?, ?, 'application_status', ?, 0, ?)
    `).run(
      notifId,
      app.candidate_user_id,
      `Your application for "${app.job_title}" at ${app.company_name} ${readableStatus}.`,
      now
    );

    // Dispatch status update email to candidate
    const candidateUser = db.prepare('SELECT email, full_name FROM users WHERE id = ?').get(app.candidate_user_id);
    if (candidateUser?.email) {
      EmailService.sendStatusUpdateEmail({
        toEmail: candidateUser.email,
        candidateName: candidateUser.full_name,
        jobTitle: app.job_title,
        companyName: app.company_name,
        status
      }).catch(err => console.error('[EmailService] Candidate status email dispatch failed:', err.message));
    }

    return this.getApplicationById(id);
  }
}
