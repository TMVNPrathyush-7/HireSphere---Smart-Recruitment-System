import { db } from '../../common/database/index.js';

export class UsersService {
  static getCandidateProfile(idOrUserId) {
    const profile = db.prepare(`
      SELECT cp.*, u.full_name, u.email, u.phone
      FROM candidate_profiles cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.id = ? OR cp.user_id = ?
    `).get(idOrUserId, idOrUserId);

    if (!profile) {
      throw new Error('Candidate profile not found');
    }

    try {
      profile.education = JSON.parse(profile.education || '[]');
      profile.work_experience = JSON.parse(profile.work_experience || '[]');
      profile.skills = JSON.parse(profile.skills || '[]');
      profile.parsed_resume_json = JSON.parse(profile.parsed_resume_json || '{}');
    } catch (e) {
      // defaults
    }

    return profile;
  }

  static updateCandidateProfile(idOrUserId, data, currentUser) {
    const profile = db.prepare('SELECT * FROM candidate_profiles WHERE id = ? OR user_id = ?').get(idOrUserId, idOrUserId);
    if (!profile) {
      throw new Error('Candidate profile not found');
    }

    if (currentUser.role !== 'admin' && currentUser.id !== profile.user_id) {
      throw new Error('Unauthorized to modify this profile');
    }

    const headline = data.headline !== undefined ? data.headline : profile.headline;
    const location = data.location !== undefined ? data.location : profile.location;
    const yearsExperience = data.years_experience !== undefined ? Number(data.years_experience) : profile.years_experience;
    const education = data.education !== undefined ? JSON.stringify(data.education) : profile.education;
    const workExperience = data.work_experience !== undefined ? JSON.stringify(data.work_experience) : profile.work_experience;
    const skills = data.skills !== undefined ? JSON.stringify(data.skills) : profile.skills;
    const resumeFileUrl = data.resume_file_url !== undefined ? data.resume_file_url : profile.resume_file_url;
    const parsedResumeJson = data.parsed_resume_json !== undefined ? JSON.stringify(data.parsed_resume_json) : profile.parsed_resume_json;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE candidate_profiles
      SET headline = ?, location = ?, years_experience = ?, education = ?, work_experience = ?, skills = ?, resume_file_url = ?, parsed_resume_json = ?, updated_at = ?
      WHERE id = ?
    `).run(headline, location, yearsExperience, education, workExperience, skills, resumeFileUrl, parsedResumeJson, now, profile.id);

    if (data.full_name || data.phone) {
      db.prepare(`
        UPDATE users
        SET full_name = COALESCE(?, full_name), phone = COALESCE(?, phone), updated_at = ?
        WHERE id = ?
      `).run(data.full_name || null, data.phone || null, now, profile.user_id);
    }

    return this.getCandidateProfile(profile.id);
  }

  static getRecruiterProfile(idOrUserId) {
    const profile = db.prepare(`
      SELECT rp.*, u.full_name, u.email, u.phone
      FROM recruiter_profiles rp
      JOIN users u ON rp.user_id = u.id
      WHERE rp.id = ? OR rp.user_id = ?
    `).get(idOrUserId, idOrUserId);

    if (!profile) {
      throw new Error('Recruiter profile not found');
    }

    return profile;
  }

  static updateRecruiterProfile(idOrUserId, data, currentUser) {
    const profile = db.prepare('SELECT * FROM recruiter_profiles WHERE id = ? OR user_id = ?').get(idOrUserId, idOrUserId);
    if (!profile) {
      throw new Error('Recruiter profile not found');
    }

    if (currentUser.role !== 'admin' && currentUser.id !== profile.user_id) {
      throw new Error('Unauthorized to modify this profile');
    }

    const companyName = data.company_name !== undefined ? data.company_name : profile.company_name;
    const companyWebsite = data.company_website !== undefined ? data.company_website : profile.company_website;
    const companySize = data.company_size !== undefined ? data.company_size : profile.company_size;
    const industry = data.industry !== undefined ? data.industry : profile.industry;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE recruiter_profiles
      SET company_name = ?, company_website = ?, company_size = ?, industry = ?, updated_at = ?
      WHERE id = ?
    `).run(companyName, companyWebsite, companySize, industry, now, profile.id);

    if (data.full_name || data.phone) {
      db.prepare(`
        UPDATE users
        SET full_name = COALESCE(?, full_name), phone = COALESCE(?, phone), updated_at = ?
        WHERE id = ?
      `).run(data.full_name || null, data.phone || null, now, profile.user_id);
    }

    return this.getRecruiterProfile(profile.id);
  }
}
