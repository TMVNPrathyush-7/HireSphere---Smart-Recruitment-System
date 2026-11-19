import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db, initDatabase } from './index.js';

export function seedData() {
  initDatabase();

  const existingUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (existingUsers && existingUsers.count > 0) {
    console.log('ℹ️ Database already seeded, skipping seed.');
    return;
  }

  console.log('🌱 Seeding initial demo data for Smart Recruitment Platform...');

  const passwordHash = bcrypt.hashSync('Password123!', 10);
  const now = new Date().toISOString();

  // 1. Admin User
  const adminId = uuidv4();
  db.prepare(`
    INSERT INTO users (id, email, password_hash, role, full_name, phone, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
  `).run(adminId, 'admin@recruitment.com', passwordHash, 'admin', 'System Administrator', '+1-800-555-0199', now, now);

  // 2. Recruiters
  const recUser1Id = uuidv4();
  const recUser2Id = uuidv4();

  db.prepare(`
    INSERT INTO users (id, email, password_hash, role, full_name, phone, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
  `).run(recUser1Id, 'recruiter@google.com', passwordHash, 'recruiter', 'David Miller', '+1-650-253-0000', now, now);

  db.prepare(`
    INSERT INTO users (id, email, password_hash, role, full_name, phone, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
  `).run(recUser2Id, 'hiring@microsoft.com', passwordHash, 'recruiter', 'Elena Rostova', '+1-425-882-8080', now, now);

  const recProf1Id = uuidv4();
  const recProf2Id = uuidv4();

  db.prepare(`
    INSERT INTO recruiter_profiles (id, user_id, company_name, company_website, company_size, industry, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(recProf1Id, recUser1Id, 'Google Cloud', 'https://cloud.google.com', '10,000+', 'Cloud & Artificial Intelligence', now, now);

  db.prepare(`
    INSERT INTO recruiter_profiles (id, user_id, company_name, company_website, company_size, industry, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(recProf2Id, recUser2Id, 'Microsoft Azure', 'https://azure.microsoft.com', '10,000+', 'Enterprise Software & Cloud', now, now);

  // 3. Candidates
  const candUser1Id = uuidv4();
  const candUser2Id = uuidv4();
  const candUser3Id = uuidv4();

  db.prepare(`
    INSERT INTO users (id, email, password_hash, role, full_name, phone, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
  `).run(candUser1Id, 'alex.chen@gmail.com', passwordHash, 'candidate', 'Alex Chen', '+1-415-555-0143', now, now);

  db.prepare(`
    INSERT INTO users (id, email, password_hash, role, full_name, phone, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
  `).run(candUser2Id, 'sarah.miller@gmail.com', passwordHash, 'candidate', 'Sarah Miller', '+1-206-555-0182', now, now);

  db.prepare(`
    INSERT INTO users (id, email, password_hash, role, full_name, phone, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
  `).run(candUser3Id, 'rohit.sharma@gmail.com', passwordHash, 'candidate', 'Rohit Sharma', '+91-98765-43210', now, now);

  const candProf1Id = uuidv4();
  const candProf2Id = uuidv4();
  const candProf3Id = uuidv4();

  // Alex Chen Profile (Full Stack)
  db.prepare(`
    INSERT INTO candidate_profiles (id, user_id, headline, location, years_experience, education, work_experience, skills, resume_file_url, parsed_resume_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    candProf1Id,
    candUser1Id,
    'Senior Full Stack Engineer | React, Node.js, Python & AWS',
    'San Francisco, CA (Open to Remote)',
    5,
    JSON.stringify([
      { degree: 'B.S. in Computer Science', institution: 'UC Berkeley', year: '2021', gpa: '3.8' }
    ]),
    JSON.stringify([
      { title: 'Full Stack Engineer', company: 'Stripe', duration: '2021 - Present', description: 'Architected distributed payment processing microservices using Node.js, React, and PostgreSQL handling $50M+ daily volume.' },
      { title: 'Software Engineering Intern', company: 'Salesforce', duration: '2020', description: 'Built automated test suites and React dashboard components.' }
    ]),
    JSON.stringify(['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker', 'AWS', 'Python', 'REST APIs', 'GraphQL', 'Redis']),
    '/uploads/sample-alex-resume.pdf',
    JSON.stringify({
      name: 'Alex Chen',
      email: 'alex.chen@gmail.com',
      skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker', 'AWS', 'Python', 'REST APIs', 'GraphQL', 'Redis'],
      ats_readiness: 94
    }),
    now,
    now
  );

  // Sarah Miller Profile (AI / ML)
  db.prepare(`
    INSERT INTO candidate_profiles (id, user_id, headline, location, years_experience, education, work_experience, skills, resume_file_url, parsed_resume_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    candProf2Id,
    candUser2Id,
    'AI/ML Systems Engineer | PyTorch, LLMs, FastAPI, Python',
    'Seattle, WA',
    4,
    JSON.stringify([
      { degree: 'M.S. in Artificial Intelligence', institution: 'University of Washington', year: '2022' }
    ]),
    JSON.stringify([
      { title: 'ML Engineer', company: 'Amazon Web Services', duration: '2022 - Present', description: 'Trained and deployed fine-tuned LLMs and RAG pipelines serving low-latency inference.' }
    ]),
    JSON.stringify(['Python', 'PyTorch', 'FastAPI', 'LLM', 'PostgreSQL', 'Docker', 'Hugging Face', 'Vector DB', 'Kubernetes', 'NLP']),
    '/uploads/sample-sarah-resume.pdf',
    JSON.stringify({
      name: 'Sarah Miller',
      email: 'sarah.miller@gmail.com',
      skills: ['Python', 'PyTorch', 'FastAPI', 'LLM', 'PostgreSQL', 'Docker', 'Hugging Face', 'Vector DB', 'Kubernetes', 'NLP'],
      ats_readiness: 91
    }),
    now,
    now
  );

  // Rohit Sharma Profile (Frontend React)
  db.prepare(`
    INSERT INTO candidate_profiles (id, user_id, headline, location, years_experience, education, work_experience, skills, resume_file_url, parsed_resume_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    candProf3Id,
    candUser3Id,
    'Frontend Developer | React, Tailwind CSS, TypeScript',
    'Bangalore, India (Remote)',
    2,
    JSON.stringify([
      { degree: 'B.Tech in Computer Engineering', institution: 'NIT Karnataka', year: '2024' }
    ]),
    JSON.stringify([
      { title: 'Junior Frontend Developer', company: 'Razorpay', duration: '2024 - Present', description: 'Developed responsive user interfaces and payment checkout screens with React and Tailwind.' }
    ]),
    JSON.stringify(['React', 'JavaScript', 'HTML5', 'CSS3', 'Tailwind CSS', 'Redux', 'Git', 'REST APIs']),
    '/uploads/sample-rohit-resume.pdf',
    JSON.stringify({
      name: 'Rohit Sharma',
      email: 'rohit.sharma@gmail.com',
      skills: ['React', 'JavaScript', 'HTML5', 'CSS3', 'Tailwind CSS', 'Redux', 'Git', 'REST APIs'],
      ats_readiness: 86
    }),
    now,
    now
  );

  // 4. Jobs
  const job1Id = uuidv4();
  const job2Id = uuidv4();
  const job3Id = uuidv4();
  const seedDeadline = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Job 1: Senior Full Stack Engineer (Google)
  db.prepare(`
    INSERT INTO jobs (id, recruiter_id, title, description, required_skills, experience_level, location, employment_type, deadline, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)
  `).run(
    job1Id,
    recProf1Id,
    'Senior Full Stack Engineer (Cloud Systems)',
    'Google Cloud is looking for a Senior Full Stack Engineer to lead the design and execution of next-generation developer tooling and web platforms. You will design scalable Node.js microservices and React frontends, integrate with relational and NoSQL databases, and implement containerized deployments on Kubernetes.',
    JSON.stringify(['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker', 'Kubernetes', 'REST APIs']),
    'Senior (4-7 years)',
    'Mountain View, CA / Remote',
    'full-time',
    seedDeadline,
    now,
    now
  );

  // Job 2: AI & LLM Systems Engineer (Google)
  db.prepare(`
    INSERT INTO jobs (id, recruiter_id, title, description, required_skills, experience_level, location, employment_type, deadline, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)
  `).run(
    job2Id,
    recProf1Id,
    'AI & LLM Platform Engineer',
    'Join the Google DeepMind & Cloud AI team to build high-throughput inference infrastructure and semantic retrieval systems. Responsible for FastAPI microservices, model serving, prompt engineering, vector databases, and evaluation frameworks.',
    JSON.stringify(['Python', 'FastAPI', 'PyTorch', 'LLM', 'Docker', 'Vector DB', 'NLP']),
    'Mid-Senior (3-6 years)',
    'San Francisco, CA / Hybrid',
    'full-time',
    seedDeadline,
    now,
    now
  );

  // Job 3: Frontend React Engineer (Microsoft)
  db.prepare(`
    INSERT INTO jobs (id, recruiter_id, title, description, required_skills, experience_level, location, employment_type, deadline, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)
  `).run(
    job3Id,
    recProf2Id,
    'Frontend React Developer (Azure Portal)',
    'Microsoft Azure Portal team is seeking a passionate Frontend Developer to craft intuitive, accessible, and ultra-fast user experiences for millions of enterprise cloud customers. Strong proficiency with modern React, TypeScript, and state management required.',
    JSON.stringify(['React', 'TypeScript', 'Tailwind CSS', 'Redux', 'HTML5', 'REST APIs']),
    'Junior-Mid (1-3 years)',
    'Redmond, WA / Remote',
    'full-time',
    seedDeadline,
    now,
    now
  );

  // 5. Applications
  const app1Id = uuidv4();
  const app2Id = uuidv4();
  const app3Id = uuidv4();

  // Alex applies to Job 1 (Senior Full Stack) -> 92 ATS, 95 Skill Match -> Rank 1
  db.prepare(`
    INSERT INTO applications (id, job_id, candidate_id, resume_snapshot_url, ats_score, skill_match_score, rank_position, status, applied_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, 'shortlisted', ?, ?)
  `).run(app1Id, job1Id, candProf1Id, '/uploads/sample-alex-resume.pdf', 92, 95, now, now);

  // Sarah applies to Job 2 (AI Platform) -> 94 ATS, 96 Skill Match -> Rank 1
  db.prepare(`
    INSERT INTO applications (id, job_id, candidate_id, resume_snapshot_url, ats_score, skill_match_score, rank_position, status, applied_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, 'interview_scheduled', ?, ?)
  `).run(app2Id, job2Id, candProf2Id, '/uploads/sample-sarah-resume.pdf', 94, 96, now, now);

  // Rohit applies to Job 3 (Frontend React) -> 88 ATS, 85 Skill Match -> Rank 1
  db.prepare(`
    INSERT INTO applications (id, job_id, candidate_id, resume_snapshot_url, ats_score, skill_match_score, rank_position, status, applied_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, 'under_review', ?, ?)
  `).run(app3Id, job3Id, candProf3Id, '/uploads/sample-rohit-resume.pdf', 88, 85, now, now);

  // 6. Interview for Sarah
  const interviewId = uuidv4();
  const slotDate1 = new Date(Date.now() + 86400000 * 2).toISOString();
  const slotDate2 = new Date(Date.now() + 86400000 * 3).toISOString();

  db.prepare(`
    INSERT INTO interviews (id, application_id, proposed_slots, confirmed_slot, status, interview_mode, meeting_link, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'confirmed', 'online', ?, ?, ?, ?)
  `).run(
    interviewId,
    app2Id,
    JSON.stringify([slotDate1, slotDate2]),
    slotDate1,
    'https://meet.google.com/abc-recruitment-demo',
    'Technical deep-dive on LLM architecture and low latency inference systems.',
    now,
    now
  );

  // 7. Mock Interview Session for Alex
  const mockId = uuidv4();
  db.prepare(`
    INSERT INTO mock_interview_sessions (id, candidate_id, job_role, questions, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    mockId,
    candProf1Id,
    'Senior Full Stack Engineer',
    JSON.stringify([
      {
        question: 'Explain how you handle optimistic UI updates and rollback mechanisms in a React + REST application.',
        category: 'Technical',
        sample_answer: 'Optimistic updates immediately update local state before the network call resolves. If the API returns an error, catch it and rollback to the snapshot captured before the mutation.'
      },
      {
        question: 'Describe a situation where a distributed service you owned experienced high latency. How did you diagnose and remediate it?',
        category: 'Behavioral / Systems',
        sample_answer: 'Utilized distributed tracing (OpenTelemetry) to isolate bottleneck to database connection starvation. Introduced connection pooling and Redis read-through caching.'
      }
    ]),
    now
  );

  // 8. Notifications
  db.prepare(`
    INSERT INTO notifications (id, user_id, type, message, is_read, created_at)
    VALUES (?, ?, ?, ?, 0, ?)
  `).run(uuidv4(), candUser2Id, 'interview_scheduled', 'Google Cloud confirmed your technical interview on ' + new Date(slotDate1).toLocaleDateString(), now);

  db.prepare(`
    INSERT INTO notifications (id, user_id, type, message, is_read, created_at)
    VALUES (?, ?, ?, ?, 0, ?)
  `).run(uuidv4(), recUser1Id, 'new_applicant', 'New applicant Alex Chen submitted application for Senior Full Stack Engineer (Cloud Systems) with 94% match.', now);

  // 9. Audit Logs
  db.prepare(`
    INSERT INTO audit_logs (id, actor_user_id, action, target_type, target_id, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), adminId, 'SYSTEM_INIT', 'PLATFORM', 'PLATFORM_ROOT', JSON.stringify({ note: 'Platform seeded with demo accounts and data.' }), now);

  console.log('✅ Demo data successfully seeded!');
  console.log('Credentials:');
  console.log('  Admin:     admin@recruitment.com     / Password123!');
  console.log('  Recruiter: recruiter@google.com      / Password123!');
  console.log('  Candidate: alex.chen@gmail.com       / Password123!');
  console.log('  Candidate: sarah.miller@gmail.com     / Password123!');
}

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedData();
}
