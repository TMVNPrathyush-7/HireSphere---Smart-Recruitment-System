import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../common/database/index.js';
import { config } from '../../config/index.js';

export class AuthService {
  static register({ email, password, role, full_name, phone, company_name, company_website, industry }) {
    if (!email || !password || !role || !full_name) {
      throw new Error('Email, password, role, and full name are required');
    }

    if (!['candidate', 'recruiter'].includes(role)) {
      throw new Error('Role must be either candidate or recruiter');
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      throw new Error('A user with this email address already exists');
    }

    const userId = uuidv4();
    const passwordHash = bcrypt.hashSync(password, 10);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, email, password_hash, role, full_name, phone, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).run(userId, email.toLowerCase().trim(), passwordHash, role, full_name.trim(), phone || null, now, now);

    let profileId = uuidv4();
    if (role === 'candidate') {
      db.prepare(`
        INSERT INTO candidate_profiles (id, user_id, headline, location, years_experience, education, work_experience, skills, created_at, updated_at)
        VALUES (?, ?, '', '', 0, '[]', '[]', '[]', ?, ?)
      `).run(profileId, userId, now, now);
    } else if (role === 'recruiter') {
      db.prepare(`
        INSERT INTO recruiter_profiles (id, user_id, company_name, company_website, company_size, industry, created_at, updated_at)
        VALUES (?, ?, ?, ?, '1-50', ?, ?, ?)
      `).run(profileId, userId, company_name || `${full_name}'s Organization`, company_website || '', industry || 'Technology', now, now);
    }

    const token = jwt.sign({ id: userId, role, email }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
    const user = db.prepare('SELECT id, email, role, full_name, phone, created_at FROM users WHERE id = ?').get(userId);

    return { token, user, profileId };
  }

  static login({ email, password }) {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.is_active) {
      throw new Error('Account has been suspended. Please contact administrator.');
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      throw new Error('Invalid email or password');
    }

    const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

    let profile = null;
    if (user.role === 'candidate') {
      profile = db.prepare('SELECT * FROM candidate_profiles WHERE user_id = ?').get(user.id);
    } else if (user.role === 'recruiter') {
      profile = db.prepare('SELECT * FROM recruiter_profiles WHERE user_id = ?').get(user.id);
    }

    const safeUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      phone: user.phone,
      created_at: user.created_at
    };

    return { token, user: safeUser, profile };
  }

  static getMe(userId) {
    const user = db.prepare('SELECT id, email, role, full_name, phone, created_at, is_active FROM users WHERE id = ?').get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    let profile = null;
    if (user.role === 'candidate') {
      profile = db.prepare('SELECT * FROM candidate_profiles WHERE user_id = ?').get(user.id);
      if (profile) {
        try {
          profile.education = JSON.parse(profile.education || '[]');
          profile.work_experience = JSON.parse(profile.work_experience || '[]');
          profile.skills = JSON.parse(profile.skills || '[]');
          profile.parsed_resume_json = JSON.parse(profile.parsed_resume_json || '{}');
        } catch (e) {
          // preserve defaults
        }
      }
    } else if (user.role === 'recruiter') {
      profile = db.prepare('SELECT * FROM recruiter_profiles WHERE user_id = ?').get(user.id);
    }

    return { user, profile };
  }
}
