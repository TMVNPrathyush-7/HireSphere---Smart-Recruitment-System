import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { config } from '../../config/index.js';

// Ensure database directory exists
const dbDir = path.dirname(config.dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Ensure uploads directory exists
if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

export const db = new DatabaseSync(config.dbPath);

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('candidate', 'recruiter', 'admin')),
      full_name TEXT NOT NULL,
      phone TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS candidate_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      headline TEXT,
      location TEXT,
      years_experience REAL DEFAULT 0,
      education TEXT DEFAULT '[]',
      work_experience TEXT DEFAULT '[]',
      skills TEXT DEFAULT '[]',
      resume_file_url TEXT,
      parsed_resume_json TEXT DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS recruiter_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      company_name TEXT NOT NULL,
      company_website TEXT,
      company_size TEXT,
      industry TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      recruiter_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      required_skills TEXT NOT NULL DEFAULT '[]',
      experience_level TEXT NOT NULL,
      location TEXT NOT NULL,
      employment_type TEXT NOT NULL CHECK(employment_type IN ('full-time', 'part-time', 'contract', 'internship')),
      deadline TEXT,
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('draft', 'open', 'closed')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(recruiter_id) REFERENCES recruiter_profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      candidate_id TEXT NOT NULL,
      resume_snapshot_url TEXT,
      ats_score REAL DEFAULT 0,
      skill_match_score REAL DEFAULT 0,
      rank_position INTEGER,
      status TEXT NOT NULL DEFAULT 'applied' CHECK(status IN ('applied', 'under_review', 'shortlisted', 'interview_scheduled', 'rejected', 'hired')),
      applied_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE CASCADE,
      FOREIGN KEY(candidate_id) REFERENCES candidate_profiles(id) ON DELETE CASCADE,
      UNIQUE(job_id, candidate_id)
    );

    CREATE TABLE IF NOT EXISTS resume_analyses (
      id TEXT PRIMARY KEY,
      candidate_id TEXT NOT NULL,
      job_id TEXT,
      ats_score REAL DEFAULT 0,
      missing_keywords TEXT DEFAULT '[]',
      suggestions TEXT DEFAULT '[]',
      skill_gaps TEXT DEFAULT '[]',
      created_at TEXT NOT NULL,
      FOREIGN KEY(candidate_id) REFERENCES candidate_profiles(id) ON DELETE CASCADE,
      FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS interviews (
      id TEXT PRIMARY KEY,
      application_id TEXT UNIQUE NOT NULL,
      proposed_slots TEXT NOT NULL DEFAULT '[]',
      confirmed_slot TEXT,
      status TEXT NOT NULL DEFAULT 'proposed' CHECK(status IN ('proposed', 'confirmed', 'rescheduled', 'completed', 'cancelled')),
      interview_mode TEXT NOT NULL DEFAULT 'online' CHECK(interview_mode IN ('online', 'in-person')),
      meeting_link TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(application_id) REFERENCES applications(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS mock_interview_sessions (
      id TEXT PRIMARY KEY,
      candidate_id TEXT NOT NULL,
      job_role TEXT NOT NULL,
      questions TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      FOREIGN KEY(candidate_id) REFERENCES candidate_profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor_user_id TEXT,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      metadata TEXT DEFAULT '{}',
      created_at TEXT NOT NULL,
      FOREIGN KEY(actor_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS email_logs (
      id TEXT PRIMARY KEY,
      to_email TEXT NOT NULL,
      subject TEXT NOT NULL,
      template_type TEXT NOT NULL,
      html_content TEXT NOT NULL,
      sent_status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  // Ensure deadline column exists on existing databases (safe auto-migration)
  try {
    const jobCols = db.prepare("PRAGMA table_info(jobs)").all();
    if (!jobCols.some(c => c.name === 'deadline')) {
      db.prepare("ALTER TABLE jobs ADD COLUMN deadline TEXT").run();
      console.log('✅ Added deadline column to jobs table');
    }
    // Set a default deadline (e.g. 45 days ahead) for any existing jobs without a deadline
    const defaultFutureDate = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    db.prepare("UPDATE jobs SET deadline = ? WHERE deadline IS NULL OR deadline = ''").run(defaultFutureDate);
  } catch (migErr) {
    console.warn('Deadline auto-migration notice:', migErr.message);
  }

  console.log('✅ SQLite Database schema initialized successfully');
}

