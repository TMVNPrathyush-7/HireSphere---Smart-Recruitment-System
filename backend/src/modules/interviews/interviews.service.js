import { v4 as uuidv4 } from 'uuid';
import { db } from '../../common/database/index.js';
import { EmailService } from '../../common/services/email.service.js';

export class InterviewsService {
  static proposeInterview(data, user) {
    const {
      application_id,
      proposed_slots = [],
      interview_mode = 'online',
      meeting_link = '',
      notes = ''
    } = data;

    if (!application_id) {
      throw new Error('application_id is required');
    }

    if (!Array.isArray(proposed_slots) || proposed_slots.length === 0) {
      throw new Error('At least one proposed interview slot is required');
    }

    const app = db.prepare(`
      SELECT a.*, j.title as job_title, rp.user_id as recruiter_user_id, rp.company_name, cp.user_id as candidate_user_id
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN recruiter_profiles rp ON j.recruiter_id = rp.id
      JOIN candidate_profiles cp ON a.candidate_id = cp.id
      WHERE a.id = ?
    `).get(application_id);

    if (!app) {
      throw new Error('Application not found');
    }

    if (user.role !== 'admin' && app.recruiter_user_id !== user.id) {
      throw new Error('Unauthorized to schedule interviews for this application');
    }

    const now = new Date().toISOString();
    const existing = db.prepare('SELECT id FROM interviews WHERE application_id = ?').get(application_id);

    let interviewId = existing ? existing.id : uuidv4();

    if (existing) {
      db.prepare(`
        UPDATE interviews
        SET proposed_slots = ?, status = 'proposed', interview_mode = ?, meeting_link = ?, notes = ?, updated_at = ?
        WHERE id = ?
      `).run(JSON.stringify(proposed_slots), interview_mode, meeting_link, notes, now, interviewId);
    } else {
      db.prepare(`
        INSERT INTO interviews (id, application_id, proposed_slots, confirmed_slot, status, interview_mode, meeting_link, notes, created_at, updated_at)
        VALUES (?, ?, ?, NULL, 'proposed', ?, ?, ?, ?, ?)
      `).run(interviewId, application_id, JSON.stringify(proposed_slots), interview_mode, meeting_link, notes, now, now);
    }

    // Update application status
    db.prepare("UPDATE applications SET status = 'interview_scheduled', updated_at = ? WHERE id = ?").run(now, application_id);

    // Notify candidate
    const notifId = uuidv4();
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, message, is_read, created_at)
      VALUES (?, ?, 'interview_proposed', ?, 0, ?)
    `).run(
      notifId,
      app.candidate_user_id,
      `${app.company_name} has proposed interview times for "${app.job_title}". Please select your preferred slot.`,
      now
    );

    // Dispatch interview proposal email to candidate
    const candidateUser = db.prepare('SELECT email, full_name FROM users WHERE id = ?').get(app.candidate_user_id);
    if (candidateUser?.email) {
      EmailService.sendInterviewProposedEmail({
        toEmail: candidateUser.email,
        candidateName: candidateUser.full_name,
        jobTitle: app.job_title,
        companyName: app.company_name,
        proposedSlots
      }).catch(err => console.error('[EmailService] Interview proposed email dispatch failed:', err.message));
    }

    return this.getInterviewById(interviewId);
  }

  static confirmSlot(interviewId, { confirmed_slot, status = 'confirmed' }, user) {
    const interview = db.prepare(`
      SELECT i.*, a.job_id, j.title as job_title, cp.user_id as candidate_user_id, rp.user_id as recruiter_user_id, rp.company_name, u.full_name as candidate_name, u.email as candidate_email
      FROM interviews i
      JOIN applications a ON i.application_id = a.id
      JOIN jobs j ON a.job_id = j.id
      JOIN recruiter_profiles rp ON j.recruiter_id = rp.id
      JOIN candidate_profiles cp ON a.candidate_id = cp.id
      JOIN users u ON cp.user_id = u.id
      WHERE i.id = ?
    `).get(interviewId);

    if (!interview) {
      throw new Error('Interview record not found');
    }

    if (user.role !== 'admin' && interview.candidate_user_id !== user.id && interview.recruiter_user_id !== user.id) {
      throw new Error('Unauthorized to confirm this interview');
    }

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE interviews
      SET confirmed_slot = ?, status = ?, updated_at = ?
      WHERE id = ?
    `).run(confirmed_slot || interview.confirmed_slot, status, now, interviewId);

    // Notify other party via in-app notification
    const targetUserId = user.id === interview.candidate_user_id ? interview.recruiter_user_id : interview.candidate_user_id;
    const notifId = uuidv4();
    const formattedDate = confirmed_slot ? new Date(confirmed_slot).toLocaleString() : 'the proposed time';

    db.prepare(`
      INSERT INTO notifications (id, user_id, type, message, is_read, created_at)
      VALUES (?, ?, 'interview_confirmed', ?, 0, ?)
    `).run(
      notifId,
      targetUserId,
      `Interview for "${interview.job_title}" has been confirmed for ${formattedDate}.`,
      now
    );

    // Dispatch interview confirmed email with "Click to Join" button to candidate
    if (interview.candidate_email) {
      EmailService.sendInterviewConfirmedEmail({
        toEmail: interview.candidate_email,
        candidateName: interview.candidate_name,
        jobTitle: interview.job_title,
        companyName: interview.company_name,
        confirmedSlot: confirmed_slot || interview.confirmed_slot,
        meetingLink: interview.meeting_link,
        interviewMode: interview.interview_mode
      }).catch(err => console.error('[EmailService] Candidate interview confirmed email dispatch failed:', err.message));
    }

    // Dispatch interview confirmed email to recruiter
    const recruiterUser = db.prepare('SELECT email, full_name FROM users WHERE id = ?').get(interview.recruiter_user_id);
    if (recruiterUser?.email) {
      EmailService.sendInterviewConfirmedEmail({
        toEmail: recruiterUser.email,
        candidateName: recruiterUser.full_name,
        jobTitle: `${interview.job_title} (Candidate: ${interview.candidate_name})`,
        companyName: interview.company_name,
        confirmedSlot: confirmed_slot || interview.confirmed_slot,
        meetingLink: interview.meeting_link,
        interviewMode: interview.interview_mode
      }).catch(err => console.error('[EmailService] Recruiter interview confirmed email dispatch failed:', err.message));
    }

    return this.getInterviewById(interviewId);
  }

  static getInterviewById(id) {
    const interview = db.prepare(`
      SELECT i.*, a.job_id, a.candidate_id,
        j.title as job_title, rp.company_name,
        u.full_name as candidate_name, u.email as candidate_email
      FROM interviews i
      JOIN applications a ON i.application_id = a.id
      JOIN jobs j ON a.job_id = j.id
      JOIN recruiter_profiles rp ON j.recruiter_id = rp.id
      JOIN candidate_profiles cp ON a.candidate_id = cp.id
      JOIN users u ON cp.user_id = u.id
      WHERE i.id = ?
    `).get(id);

    if (!interview) {
      throw new Error('Interview not found');
    }

    try {
      interview.proposed_slots = JSON.parse(interview.proposed_slots || '[]');
    } catch (e) {
      interview.proposed_slots = [];
    }

    return interview;
  }

  static getCandidateInterviews(candidateIdOrUserId) {
    const candidate = db.prepare('SELECT id FROM candidate_profiles WHERE id = ? OR user_id = ?').get(candidateIdOrUserId, candidateIdOrUserId);
    if (!candidate) return [];

    const interviews = db.prepare(`
      SELECT i.*, j.title as job_title, rp.company_name, rp.company_website
      FROM interviews i
      JOIN applications a ON i.application_id = a.id
      JOIN jobs j ON a.job_id = j.id
      JOIN recruiter_profiles rp ON j.recruiter_id = rp.id
      WHERE a.candidate_id = ?
      ORDER BY i.created_at DESC
    `).all(candidate.id);

    return interviews.map(i => {
      try {
        i.proposed_slots = JSON.parse(i.proposed_slots || '[]');
      } catch (e) {}
      return i;
    });
  }

  static getRecruiterInterviews(recruiterIdOrUserId) {
    const recruiter = db.prepare('SELECT id FROM recruiter_profiles WHERE id = ? OR user_id = ?').get(recruiterIdOrUserId, recruiterIdOrUserId);
    if (!recruiter) return [];

    const interviews = db.prepare(`
      SELECT i.*, j.title as job_title, u.full_name as candidate_name, u.email as candidate_email, cp.skills as candidate_skills
      FROM interviews i
      JOIN applications a ON i.application_id = a.id
      JOIN jobs j ON a.job_id = j.id
      JOIN candidate_profiles cp ON a.candidate_id = cp.id
      JOIN users u ON cp.user_id = u.id
      WHERE j.recruiter_id = ?
      ORDER BY i.created_at DESC
    `).all(recruiter.id);

    return interviews.map(i => {
      try {
        i.proposed_slots = JSON.parse(i.proposed_slots || '[]');
        i.candidate_skills = JSON.parse(i.candidate_skills || '[]');
      } catch (e) {}
      return i;
    });
  }
}
