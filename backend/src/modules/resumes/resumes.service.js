import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../common/database/index.js';
import { AiProxyService } from '../ai_proxy/ai_proxy.service.js';

function deduplicateSkills(skillsArray) {
  if (!Array.isArray(skillsArray)) return [];
  const seen = new Set();
  const deduped = [];
  for (const s of skillsArray) {
    if (!s || typeof s !== 'string') continue;
    const trimmed = s.trim();
    const lower = trimmed.toLowerCase();
    if (lower && !seen.has(lower)) {
      seen.add(lower);
      deduped.push(trimmed);
    }
  }
  return deduped;
}

export class ResumesService {
  static async handleResumeUpload(file, user) {
    if (!file) {
      throw new Error('No resume file uploaded');
    }

    const candidate = db.prepare('SELECT * FROM candidate_profiles WHERE user_id = ?').get(user.id);
    if (!candidate) {
      throw new Error('Candidate profile not found');
    }

    const fileUrl = `/uploads/${file.filename}`;

    // Read plain text if possible or pass to AI proxy
    let rawText = '';
    try {
      if (file.mimetype === 'text/plain') {
        rawText = fs.readFileSync(file.path, 'utf-8');
      }
    } catch (e) {
      // ignore
    }

    const parsedData = await AiProxyService.parseResume(fileUrl, file.originalname, rawText);

    const cleanSkills = deduplicateSkills(parsedData.skills);
    parsedData.skills = cleanSkills;

    const now = new Date().toISOString();
    const skillsJson = JSON.stringify(cleanSkills);
    const parsedJson = JSON.stringify(parsedData);
    const educationJson = JSON.stringify(parsedData.education || []);
    const workExpJson = JSON.stringify(parsedData.work_experience || []);
    const headline = parsedData.headline || candidate.headline || 'Software Developer';
    const location = parsedData.location || candidate.location || 'Open to Remote';

    // Update candidate profile with extracted document data (without overwriting user account identity)
    db.prepare(`
      UPDATE candidate_profiles
      SET resume_file_url = ?, headline = ?, location = ?, education = ?, work_experience = ?, skills = ?, parsed_resume_json = ?, updated_at = ?
      WHERE id = ?
    `).run(fileUrl, headline, location, educationJson, workExpJson, skillsJson, parsedJson, now, candidate.id);

    return {
      file_url: fileUrl,
      parsed_data: parsedData
    };
  }

  static async buildStructuredResume(data, user) {
    const candidate = db.prepare('SELECT * FROM candidate_profiles WHERE user_id = ?').get(user.id);
    if (!candidate) {
      throw new Error('Candidate profile not found');
    }

    const {
      name,
      headline = '',
      location = '',
      email,
      phone,
      linkedin_url = '',
      github_url = '',
      portfolio_url = '',
      years_experience = 0,
      education = [],
      projects = [],
      work_experience = [],
      certifications = [],
      skills = [],
      summary = ''
    } = data;

    const cleanSkills = deduplicateSkills(skills);
    const now = new Date().toISOString();
    const parsedData = {
      name: name || user.full_name,
      email: email || user.email,
      phone: phone || user.phone,
      headline,
      location,
      linkedin_url,
      github_url,
      portfolio_url,
      summary,
      skills: cleanSkills,
      projects,
      education,
      work_experience,
      certifications,
      ats_readiness: Math.min(96, Math.max(70, 58 + cleanSkills.length * 2 + (projects.length + work_experience.length) * 4))
    };

    db.prepare(`
      UPDATE candidate_profiles
      SET headline = ?, location = ?, years_experience = ?, education = ?, work_experience = ?, skills = ?, parsed_resume_json = ?, updated_at = ?
      WHERE id = ?
    `).run(
      headline,
      location,
      Number(years_experience) || 0,
      JSON.stringify(education),
      JSON.stringify(work_experience),
      JSON.stringify(cleanSkills),
      JSON.stringify(parsedData),
      now,
      candidate.id
    );

    return {
      message: 'Resume structured and saved successfully',
      candidate_profile_id: candidate.id,
      resume_data: parsedData
    };
  }


  static getParsedResume(candidateIdOrUserId) {
    const candidate = db.prepare('SELECT parsed_resume_json, resume_file_url FROM candidate_profiles WHERE id = ? OR user_id = ?').get(candidateIdOrUserId, candidateIdOrUserId);
    if (!candidate) {
      throw new Error('Candidate not found');
    }

    try {
      return {
        resume_file_url: candidate.resume_file_url,
        parsed_resume: JSON.parse(candidate.parsed_resume_json || '{}')
      };
    } catch (e) {
      return { resume_file_url: candidate.resume_file_url, parsed_resume: {} };
    }
  }

  static async getResumeSuggestions(candidateIdOrUserId, jobId = null) {
    const candidate = db.prepare('SELECT * FROM candidate_profiles WHERE id = ? OR user_id = ?').get(candidateIdOrUserId, candidateIdOrUserId);
    if (!candidate) {
      throw new Error('Candidate not found');
    }

    let job = null;
    if (jobId) {
      job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
      if (job) {
        try {
          job.required_skills = JSON.parse(job.required_skills || '[]');
        } catch (e) {
          job.required_skills = [];
        }
      }
    }

    try {
      candidate.skills = JSON.parse(candidate.skills || '[]');
      candidate.work_experience = JSON.parse(candidate.work_experience || '[]');
      candidate.education = JSON.parse(candidate.education || '[]');
      const parsed = JSON.parse(candidate.parsed_resume_json || '{}');
      candidate.projects = parsed.projects || [];
      candidate.summary = parsed.summary || parsed.experience_summary || '';
    } catch (e) {}

    return await AiProxyService.generateResumeSuggestions(candidate, job);
  }

  static async getSkillGap(candidateIdOrUserId, jobId) {
    if (!jobId) {
      throw new Error('jobId query parameter is required for skill gap analysis');
    }

    const candidate = db.prepare('SELECT skills FROM candidate_profiles WHERE id = ? OR user_id = ?').get(candidateIdOrUserId, candidateIdOrUserId);
    if (!candidate) {
      throw new Error('Candidate not found');
    }

    const job = db.prepare('SELECT required_skills, title FROM jobs WHERE id = ?').get(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    let candSkills = [];
    let jobSkills = [];
    try {
      candSkills = JSON.parse(candidate.skills || '[]');
      jobSkills = JSON.parse(job.required_skills || '[]');
    } catch (e) {}

    const analysis = await AiProxyService.analyzeSkillGap(candSkills, jobSkills);
    return {
      job_title: job.title,
      ...analysis
    };
  }
}
