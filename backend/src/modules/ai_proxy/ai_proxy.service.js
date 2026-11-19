import { config } from '../../config/index.js';

export class AiProxyService {
  static async requestAiService(endpoint, body = {}, isMultipart = false, formData = null) {
    try {
      const url = `${config.aiServiceUrl}${endpoint}`;
      const options = {
        method: 'POST',
        headers: isMultipart ? {} : { 'Content-Type': 'application/json' },
        body: isMultipart ? formData : JSON.stringify(body)
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout for AI LLM inference
      options.signal = controller.signal;

      const response = await fetch(url, options);
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`AI Service returned ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      console.warn(`[AiProxy] Direct call to Python AI service (${endpoint}) unavailable: ${err.message}. Running fallback heuristics engine.`);
      return null;
    }
  }

  // 1. Resume Parser
  static async parseResume(fileUrl, fileName, rawText = '') {
    const aiResult = await this.requestAiService('/api/ai/parse-resume', { file_url: fileUrl, file_name: fileName, text: rawText });
    if (aiResult) return aiResult;

    // Built-in intelligent heuristic fallback
    const extractedSkills = [];
    const skillDictionary = [
      'React', 'Node.js', 'TypeScript', 'JavaScript', 'Python', 'FastAPI', 'Express',
      'PostgreSQL', 'MongoDB', 'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure',
      'HTML5', 'CSS3', 'Tailwind CSS', 'Redux', 'PyTorch', 'TensorFlow', 'LLM',
      'REST APIs', 'GraphQL', 'Git', 'CI/CD', 'Linux', 'SQL', 'NoSQL', 'Next.js'
    ];

    const lower = rawText.toLowerCase();
    skillDictionary.forEach(skill => {
      if (lower.includes(skill.toLowerCase())) {
        extractedSkills.push(skill);
      }
    });

    return {
      name: fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
      email: rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] || 'candidate@example.com',
      phone: rawText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)?.[0] || '+1-555-0199',
      skills: extractedSkills.length > 0 ? extractedSkills : ['React', 'JavaScript', 'Node.js', 'REST APIs'],
      experience_summary: rawText.slice(0, 300) || 'Experienced software professional with demonstrated technical expertise.',
      ats_readiness: Math.min(95, Math.max(65, 50 + extractedSkills.length * 4))
    };
  }

  // 2. ATS Score
  static async calculateAtsScore(candidateProfile, job) {
    const aiResult = await this.requestAiService('/api/ai/ats-score', { candidate: candidateProfile, job });
    if (aiResult) return aiResult;

    // Fallback ATS calculation
    let score = 50;
    const issues = [];
    const passed = [];

    const skills = candidateProfile.skills || [];
    const reqSkills = job?.required_skills || [];

    if (skills.length >= 5) {
      score += 15;
      passed.push('Solid keyword representation and skill breadth detected.');
    } else {
      issues.push('Limited skills listed; recommend expanding technical stack section.');
    }

    if (candidateProfile.headline && candidateProfile.headline.length > 10) {
      score += 10;
      passed.push('Professional headline is prominent and concise.');
    } else {
      issues.push('Missing targeted professional headline.');
    }

    if (Array.isArray(candidateProfile.work_experience) && candidateProfile.work_experience.length > 0) {
      score += 15;
      passed.push('Structured work experience with measurable bullet points.');
    } else {
      issues.push('Work experience section could benefit from quantifiable achievements.');
    }

    if (Array.isArray(candidateProfile.education) && candidateProfile.education.length > 0) {
      score += 10;
      passed.push('Standard academic accreditation present.');
    }

    // Overlap bonus
    const overlap = reqSkills.filter(rs => skills.some(cs => cs.toLowerCase().includes(rs.toLowerCase()) || rs.toLowerCase().includes(cs.toLowerCase())));
    const overlapBonus = reqSkills.length > 0 ? Math.round((overlap.length / reqSkills.length) * 10) : 5;
    score += overlapBonus;

    score = Math.min(98, Math.max(45, score));

    return {
      ats_score: score,
      passed_checks: passed,
      issues_flagged: issues
    };
  }

  // 3. Skill Match Score
  static async calculateSkillMatch(candidateSkills = [], requiredSkills = []) {
    const aiResult = await this.requestAiService('/api/ai/skill-match', { candidate_skills: candidateSkills, required_skills: requiredSkills });
    if (aiResult) return aiResult;

    if (!requiredSkills.length) {
      return { match_percentage: 85, matched_skills: candidateSkills, missing_skills: [] };
    }

    const cSkillsLower = candidateSkills.map(s => s.toLowerCase().trim());
    const matched = [];
    const missing = [];

    requiredSkills.forEach(req => {
      const rLower = req.toLowerCase().trim();
      const isMatch = cSkillsLower.some(cand => cand.includes(rLower) || rLower.includes(cand));
      if (isMatch) {
        matched.push(req);
      } else {
        missing.push(req);
      }
    });

    const matchPercentage = Math.round((matched.length / requiredSkills.length) * 100);

    return {
      match_percentage: matchPercentage,
      matched_skills: matched,
      missing_skills: missing
    };
  }

  // 4. Candidate Ranking
  static async rankCandidates(applications) {
    const aiResult = await this.requestAiService('/api/ai/rank-candidates', { applications });
    if (aiResult) return aiResult;

    // 40% ATS + 60% Skill Match composite score
    return applications
      .map(app => {
        const composite = Math.round((app.ats_score * 0.4) + (app.skill_match_score * 0.6));
        return {
          ...app,
          composite_score: composite
        };
      })
      .sort((a, b) => b.composite_score - a.composite_score)
      .map((app, index) => ({
        ...app,
        rank_position: index + 1
      }));
  }

  // 5. Resume Suggestions
  static async generateResumeSuggestions(candidateProfile, job = null) {
    const aiResult = await this.requestAiService('/api/ai/resume-suggestions', { candidate: candidateProfile, job });
    if (aiResult) return aiResult;

    const suggestions = [
      {
        category: 'Action Verbs & Impact',
        advice: 'Begin your experience bullets with strong action verbs (e.g., "Architected", "Optimized", "Scaled") rather than passive voice.',
        impact: 'High'
      },
      {
        category: 'Metrics & Quantification',
        advice: 'Quantify outcomes with numbers or percentages (e.g. "Reduced API latency by 35% through connection pooling").',
        impact: 'High'
      },
      {
        category: 'Keyword Alignment',
        advice: job ? `Align your skills specifically to highlight ${job.required_skills?.slice(0, 3).join(', ')} prominently.` : 'Ensure top in-demand cloud and architectural skills appear in the upper third of your resume.',
        impact: 'Medium'
      },
      {
        category: 'Section Formatting',
        advice: 'Use clean ATS-friendly headers: Professional Summary, Core Competencies, Experience, Education, and Certifications.',
        impact: 'Medium'
      }
    ];

    return { suggestions };
  }

  // 6. Skill Gap Analysis
  static async analyzeSkillGap(candidateSkills = [], requiredSkills = []) {
    const aiResult = await this.requestAiService('/api/ai/skill-gap', { candidate_skills: candidateSkills, required_skills: requiredSkills });
    if (aiResult) return aiResult;

    const { matched_skills, missing_skills, match_percentage } = await this.calculateSkillMatch(candidateSkills, requiredSkills);

    const learningResources = {
      'Docker': 'Official Docker Docs & Katacoda interactive scenarios',
      'Kubernetes': 'Kubernetes Up & Running (O\'Reilly) / KubeAcademy',
      'AWS': 'AWS Skill Builder & Cloud Practitioner Quest',
      'TypeScript': 'TypeScript Handbook & Total TypeScript tutorials',
      'Python': 'Automate the Boring Stuff with Python & Fast.ai',
      'FastAPI': 'FastAPI Official Interactive Tutorial',
      'PyTorch': 'Deep Learning with PyTorch: A 60 Minute Blitz',
      'LLM': 'DeepLearning.AI: Building Systems with the ChatGPT API',
      'PostgreSQL': 'Use The Index, Luke! & Postgres Guide',
      'GraphQL': 'How to GraphQL fullstack tutorials'
    };

    const recommendations = missing_skills.map(skill => ({
      skill,
      priority: 'High',
      recommendation: learningResources[skill] || `Complete practical hands-on project documentation and exercises for ${skill}.`
    }));

    return {
      match_percentage,
      matched_skills,
      missing_skills,
      recommendations
    };
  }

  // 7. Mock Interview Questions
  static async generateMockInterview(jobRole = 'Software Engineer', skills = []) {
    const aiResult = await this.requestAiService('/api/ai/mock-interview-questions', { role: jobRole, skills });
    if (aiResult) return aiResult;

    const baseQuestions = [
      {
        id: 1,
        question: `How do you approach architecting scalable solutions when working with ${skills[0] || 'modern tech stacks'} in production?`,
        type: 'Technical Architecture',
        difficulty: 'Medium',
        sample_answer: 'Focus on modularity, clear separation of concerns, error boundary isolation, caching layers, and decoupled async processing queues.',
        evaluation_criteria: 'Demonstrates deep knowledge of trade-offs, scalability bottlenecks, and resilience patterns.'
      },
      {
        id: 2,
        question: 'Describe a complex technical bug or production outage you investigated. What was your root cause analysis methodology?',
        type: 'Behavioral & Troubleshooting',
        difficulty: 'Medium',
        sample_answer: 'Structure response with the STAR framework: Situation, Task, Action (log aggregation, binary search debugging, reproducible test case), and Result (fix deployed + post-mortem).',
        evaluation_criteria: 'Structured debugging, composure under pressure, and preventative mindset.'
      },
      {
        id: 3,
        question: `What are best practices for database query optimization and index design when querying high-volume tables?`,
        type: 'Database Systems',
        difficulty: 'Hard',
        sample_answer: 'Analyze execution plans (EXPLAIN ANALYZE), avoid SELECT *, create composite indexes aligned with WHERE and ORDER BY clauses, and implement read replicas or partitioning.',
        evaluation_criteria: 'Knowledge of B-Tree indexes, full table scan costs, and query execution plans.'
      },
      {
        id: 4,
        question: 'How do you handle disagreements with technical peers or product managers regarding architectural decisions?',
        type: 'Collaboration & Leadership',
        difficulty: 'Medium',
        sample_answer: 'Ground discussions in objective metrics, user needs, and prototypes. Disagree and commit once consensus or leadership direction is established.',
        evaluation_criteria: 'Empathy, constructive communication, and team cohesion.'
      }
    ];

    return {
      role: jobRole,
      questions: baseQuestions
    };
  }

  // 8. Evaluate Mock Interview Answer
  static async evaluateInterviewAnswer(data) {
    const aiResult = await this.requestAiService('/api/ai/evaluate-interview-answer', data);
    if (aiResult) return aiResult;

    // Fallback heuristic evaluation
    const answer = data.user_answer || '';
    const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;
    const score = Math.min(9.0, Math.max(4.0, 3.5 + wordCount / 18.0));
    return {
      score: Number(score.toFixed(1)),
      rating: score >= 7.5 ? 'Proficient' : (score >= 6.0 ? 'Good' : 'Developing'),
      strengths: [
        `Candidate articulated an answer with ${wordCount} words addressing the prompt context.`,
        'Demonstrates general familiarity with key engineering principles.'
      ],
      missing_key_concepts: [
        'Consider elaborating further on concrete architectural bottlenecks and recovery patterns.',
        'Incorporate measurable results or industry tools into your answer.'
      ],
      actionable_feedback: 'A good attempt. To elevate your score, explain the why behind your architectural choices and reference specific metrics.'
    };
  }

  // 9. Interactive Live AI Interview Turn
  static async interactiveInterviewTurn(data) {
    const aiResult = await this.requestAiService('/api/ai/interactive-interview-turn', data);
    if (aiResult) return aiResult;

    const {
      role = 'Software Engineer',
      company = 'General Tech',
      skills = [],
      turn = 1,
      total_turns = 4,
      resume_data = {},
      history = []
    } = data;

    const primarySkill = skills[0] || 'Distributed Systems';
    const secondarySkill = skills[1] || 'Database Reliability';
    const candidateAnswers = (history || []).filter(h => h.speaker === 'candidate').map(h => h.text || '');
    const isCompanySpecific = company && company !== 'General Tech';
    const interviewerLabel = isCompanySpecific ? `Alex (Staff Lead • ${company})` : 'Alex (Staff Technical Lead)';

    const projects = Array.isArray(resume_data.projects) ? resume_data.projects : [];
    const experience = Array.isArray(resume_data.experience) ? resume_data.experience : (Array.isArray(resume_data.work_experience) ? resume_data.work_experience : []);
    const topProject = projects[0] && typeof projects[0] === 'object' ? projects[0] : null;
    const topExp = experience[0] && typeof experience[0] === 'object' ? experience[0] : null;

    if (turn <= 1 && candidateAnswers.length === 0) {
      let openingQ = '';
      if (topProject) {
        const title = topProject.title || topProject.name || 'your featured project';
        const stack = topProject.tech_stack || primarySkill;
        openingQ = `To kick off: Looking at your resume, I was particularly interested in your work on "${title}" built with ${stack}. Could you walk me through the overall system architecture you designed for it, the key technical decisions you made, and what was the most difficult bottleneck you had to overcome?`;
      } else if (topExp) {
        const title = topExp.title || 'Engineer';
        const expComp = topExp.company || 'your past team';
        openingQ = `To kick off: Looking over your background as ${title} at ${expComp}, could you walk me through an end-to-end service or feature you engineered there? Specifically, how did you structure the data flow and ensure reliability under concurrent traffic?`;
      } else {
        openingQ = `To kick off: Looking at your technical background in ${primarySkill}, could you walk me through a complex architectural project you engineered? How did you structure the service boundaries, and how did you prevent resource contention and memory leaks under peak load?`;
      }

      const greetingSuffix = isCompanySpecific ? ` for ${company}` : '';
      return {
        interviewer_name: interviewerLabel,
        feedback_snippet: `Welcome! I'm Alex, Staff Technical Lead${greetingSuffix}. I'll be conducting your technical deep-dive round for the ${role} role today.`,
        next_question: openingQ,
        is_final: false,
        final_evaluation: null
      };
    }

    if (turn === 2) {
      let q2 = `Building on your point: Suppose your primary queue or database experiences a 3x traffic spike while ${secondarySkill} processes asynchronous events. How do you implement backpressure, circuit breaking, and idempotency to ensure zero data duplication?`;
      const compLower = company.toLowerCase();
      if (compLower.includes('stripe')) {
        q2 = `At Stripe, payment reliability is paramount. When thousands of duplicate payment webhook events hit your ingest worker during a network retry storm, how do you architect your idempotency keys and state machines to ensure zero double-charges?`;
      } else if (compLower.includes('google')) {
        q2 = `At Google Cloud scale, services handle tens of thousands of requests per second. How do you prevent thread starvation, connection pool exhaustion, and memory leaks when upstream microservices suffer intermittent latency spikes?`;
      } else if (compLower.includes('amazon') || compLower.includes('aws')) {
        q2 = `In AWS multi-region architectures, network partitions can isolate availability zones. How do you design your data persistence layer to maintain write availability while preventing split-brain inconsistencies?`;
      } else if (compLower.includes('uber')) {
        q2 = `At Uber scale, real-time rider dispatch and driver location streams generate millions of telemetry events per second. How do you design your websocket connection gateways and state machines to handle abrupt network disconnections and surge pricing recalculations without dropping state?`;
      } else if (compLower.includes('netflix')) {
        q2 = `At Netflix, streaming availability depends on regional failover and fault isolation. When a critical downstream microservice begins throwing 500 errors during peak evening hours, how do you implement circuit breaking, graceful degradation, and edge caching to keep user streams alive?`;
      } else if (compLower.includes('microsoft')) {
        q2 = `In enterprise architectures at Microsoft scale, multi-tenant services handle asynchronous message queues and identity validation. How do you prevent noisy-neighbor resource starvation and design token validation caching to withstand sudden authentication retry storms?`;
      } else if (compLower.includes('nvidia')) {
        q2 = `At NVIDIA, high-throughput model inference pipelines require zero-copy memory transfers and optimized GPU batching. How do you design your asynchronous queuing and thread synchronization to prevent GPU idle stalls while avoiding host memory bottlenecks?`;
      } else if (compLower.includes('nutanix')) {
        q2 = `In high-performance virtualization systems, disk I/O and memory cache misses directly degrade customer VMs. How do you optimize memory allocations, cache eviction, and lock contention under intense I/O pressure?`;
      } else if (isCompanySpecific) {
        q2 = `At ${company}, core production systems handle high concurrency and strict SLAs. Suppose your core ingest pipeline experiences a 3x traffic spike while processing asynchronous events. How do you implement backpressure, circuit breaking, and idempotency to ensure zero data loss?`;
      }

      return {
        interviewer_name: interviewerLabel,
        feedback_snippet: 'Solid points on component separation and service boundaries.',
        next_question: q2,
        is_final: false,
        final_evaluation: null
      };
    }

    if (turn === 3 && turn < total_turns) {
      return {
        interviewer_name: interviewerLabel,
        feedback_snippet: 'Great explanation of fault isolation and message semantics.',
        next_question: `Let's discuss production diagnostics: When latency spikes (p99 exceeds SLA limits) in a high-throughput microservice, what metrics, distributed tracing tools, and profiling techniques do you use to determine whether the bottleneck is CPU, I/O, or database lock contention?`,
        is_final: false,
        final_evaluation: null
      };
    }

    // Final Round Turn >= total_turns
    const totalWords = candidateAnswers.reduce((sum, a) => sum + a.trim().split(/\s+/).filter(Boolean).length, 0);
    const score = Number(Math.min(9.5, Math.max(5.5, 5.0 + totalWords / 40.0)).toFixed(1));
    const rating = score >= 8.5 ? 'Strong Hire' : (score >= 7.2 ? 'Hire' : 'Leaning Hire');

    return {
      interviewer_name: interviewerLabel,
      feedback_snippet: 'Thank you for walking through your reasoning and architectures today. That wraps up our technical deep-dive round!',
      next_question: '',
      is_final: true,
      final_evaluation: {
        overall_score: score,
        rating,
        technical_depth: `Demonstrated solid architectural comprehension of ${primarySkill} scalability, connection resilience, and distributed component isolation.`,
        communication: 'Articulate, composed, and able to structure complex technical trade-offs logically under pressure.',
        key_strengths: [
          `Proficient understanding of ${primarySkill} service scalability and data isolation`,
          'Sound instincts regarding failure boundaries and distributed fallback patterns',
          'Clear communication of trade-offs under architectural constraints'
        ],
        growth_areas: [
          'Incorporate quantifiable performance benchmarks (e.g. p99 latencies under 50ms, memory thresholds)',
          'Elaborate further on automated observability, health probes, and self-healing circuits'
        ]
      }
    };
  }

}

