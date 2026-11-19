import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  FileText,
  Sparkles,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Upload,
  Info,
  ExternalLink,
  Globe,
  Briefcase,
  GraduationCap,
  Award,
  Code,
  Activity,
  TrendingUp,
  Check
} from 'lucide-react';

// Custom clean SVGs for LinkedIn & GitHub to avoid any icon-set version incompatibility
const LinkedInIcon = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg>
);

const GitHubIcon = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
  </svg>
);

const sanitizeUrl = (url) => {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `https://${trimmed}`;
};

export function ResumeBuilder() {
  const { user, profile, refreshProfile } = useAuth();
  
  // Document Personal Information (editable, does not alter user login account)
  const [name, setName] = useState('');
  const [headline, setHeadline] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [summary, setSummary] = useState('');

  // Structured Sections
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [projects, setProjects] = useState([]);
  const [experience, setExperience] = useState([]);
  const [education, setEducation] = useState([]);
  const [certifications, setCertifications] = useState([]);

  // UI state
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile) {
      const parsed = profile.parsed_resume_json || {};
      setName(parsed.name || user?.full_name || 'Alex Chen');
      setEmail(parsed.email || user?.email || 'alex.chen@example.com');
      setPhone(parsed.phone || user?.phone || '+1-555-0143');
      setHeadline(profile.headline || parsed.headline || 'Full-Stack Developer');
      setLocation(profile.location || parsed.location || 'Open to Remote');
      setLinkedinUrl(parsed.linkedin_url || '');
      setGithubUrl(parsed.github_url || '');
      setPortfolioUrl(parsed.portfolio_url || '');
      setSummary(parsed.summary || parsed.experience_summary || profile.bio || '');

      // Skills (case-insensitively deduplicated)
      const rawSkills = Array.isArray(profile.skills) && profile.skills.length > 0 
        ? profile.skills 
        : (Array.isArray(parsed.skills) ? parsed.skills : ['Python', 'JavaScript', 'React', 'Node.js', 'SQL']);
      const seenInit = new Set();
      const loadedSkills = rawSkills.filter(s => {
        if (!s || typeof s !== 'string') return false;
        const k = s.trim().toLowerCase();
        if (!k || seenInit.has(k)) return false;
        seenInit.add(k);
        return true;
      });
      setSkills(loadedSkills);

      // Projects
      if (Array.isArray(parsed.projects) && parsed.projects.length > 0) {
        setProjects(parsed.projects);
      } else {
        setProjects([
          {
            title: 'Travel Booking & Itinerary Platform',
            tech_stack: 'React, Node.js, Express, MongoDB, Tailwind CSS',
            link: 'https://github.com/example/travel-app',
            description: 'Designed responsive user interfaces and RESTful APIs with secure JWT authentication and real-time destination recommendations.'
          }
        ]);
      }

      // Work Experience / Internships (freshers can have 0)
      if (Array.isArray(profile.work_experience) && profile.work_experience.length > 0) {
        setExperience(profile.work_experience);
      } else if (Array.isArray(parsed.work_experience) && parsed.work_experience.length > 0) {
        setExperience(parsed.work_experience);
      } else {
        setExperience([]);
      }

      // Education
      if (Array.isArray(profile.education) && profile.education.length > 0) {
        setEducation(profile.education);
      } else if (Array.isArray(parsed.education) && parsed.education.length > 0) {
        setEducation(parsed.education);
      } else {
        setEducation([
          {
            degree: 'Bachelor of Technology in Computer Science',
            institution: 'University College of Engineering',
            year: '2022 - 2026',
            score: 'CGPA: 8.5 / 10'
          }
        ]);
      }

      // Certifications
      if (Array.isArray(parsed.certifications) && parsed.certifications.length > 0) {
        setCertifications(parsed.certifications);
      } else {
        setCertifications([]);
      }
    }
  }, [profile, user]);

  // Skill Handlers
  const handleAddSkill = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      e.preventDefault();
      const trimmed = skillInput.trim();
      if (trimmed && !skills.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
        setSkills([...skills, trimmed]);
        setSkillInput('');
      }
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  // Project Handlers
  const handleAddProject = () => {
    setProjects([
      ...projects,
      { title: '', tech_stack: '', link: '', description: '' }
    ]);
  };

  const handleUpdateProject = (index, field, value) => {
    const updated = [...projects];
    updated[index][field] = value;
    setProjects(updated);
  };

  const handleRemoveProject = (index) => {
    setProjects(projects.filter((_, i) => i !== index));
  };

  // Experience Handlers
  const handleAddExperience = () => {
    setExperience([
      ...experience,
      { title: '', company: '', duration: '', description: '' }
    ]);
  };

  const handleUpdateExperience = (index, field, value) => {
    const updated = [...experience];
    updated[index][field] = value;
    setExperience(updated);
  };

  const handleRemoveExperience = (index) => {
    setExperience(experience.filter((_, i) => i !== index));
  };

  // Education Handlers
  const handleAddEducation = () => {
    setEducation([
      ...education,
      { degree: '', institution: '', year: '', score: '' }
    ]);
  };

  const handleUpdateEducation = (index, field, value) => {
    const updated = [...education];
    updated[index][field] = value;
    setEducation(updated);
  };

  const handleRemoveEducation = (index) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  // Certification Handlers
  const handleAddCertification = () => {
    setCertifications([
      ...certifications,
      { name: '', issuer: '', year: '' }
    ]);
  };

  const handleUpdateCertification = (index, field, value) => {
    const updated = [...certifications];
    updated[index][field] = value;
    setCertifications(updated);
  };

  const handleRemoveCertification = (index) => {
    setCertifications(certifications.filter((_, i) => i !== index));
  };

  // Save Resume Document and Update Profile
  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess('');
    try {
      await api.resumes.build({
        name,
        headline,
        location,
        email,
        phone,
        linkedin_url: linkedinUrl,
        github_url: githubUrl,
        portfolio_url: portfolioUrl,
        summary,
        skills,
        projects,
        work_experience: experience,
        education,
        certifications,
        years_experience: experience.length > 0 ? experience.length * 1.5 : 0
      });
      await refreshProfile();
      setSaveSuccess('Resume structured and candidate profile updated successfully!');
      setTimeout(() => setSaveSuccess(''), 4000);
    } catch (e) {
      alert(e.message || 'Error saving resume');
    } finally {
      setSaving(false);
    }
  };

  // AI Suggestions
  const handleFetchAiSuggestions = async () => {
    if (!profile) return;
    setLoadingSuggestions(true);
    try {
      const res = await api.resumes.getSuggestions(profile.id);
      setSuggestions(res.suggestions || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Resume Upload (AI OCR parsing)
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const result = await api.resumes.upload(formData);
      const parsed = result.parsed_data;
      if (parsed) {
        if (parsed.name) setName(parsed.name);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.headline) setHeadline(parsed.headline);
        if (parsed.location) setLocation(parsed.location);
        if (parsed.linkedin_url) setLinkedinUrl(parsed.linkedin_url);
        if (parsed.github_url) setGithubUrl(parsed.github_url);
        if (parsed.portfolio_url) setPortfolioUrl(parsed.portfolio_url);
        if (parsed.experience_summary || parsed.summary) setSummary(parsed.experience_summary || parsed.summary);
        if (Array.isArray(parsed.skills) && parsed.skills.length > 0) {
          const seenUp = new Set();
          const cleanUp = parsed.skills.filter(s => {
            if (!s || typeof s !== 'string') return false;
            const k = s.trim().toLowerCase();
            if (!k || seenUp.has(k)) return false;
            seenUp.add(k);
            return true;
          });
          setSkills(cleanUp);
        }
        if (Array.isArray(parsed.projects) && parsed.projects.length > 0) setProjects(parsed.projects);
        if (Array.isArray(parsed.work_experience)) setExperience(parsed.work_experience);
        if (Array.isArray(parsed.education) && parsed.education.length > 0) setEducation(parsed.education);
        if (Array.isArray(parsed.certifications) && parsed.certifications.length > 0) setCertifications(parsed.certifications);
      }
      await refreshProfile();
      setSaveSuccess('Resume parsed with AI! Document fields and links have been populated below.');
      setTimeout(() => setSaveSuccess(''), 5000);
    } catch (err) {
      alert(err.message || 'Failed to parse resume');
    } finally {
      setUploading(false);
    }
  };

  // Real-Time Live ATS Compatibility & Resume Quality Calculation (5-Factor Benchmark)
  const liveAts = useMemo(() => {
    const checks = [];

    // 1. Resume Parsing Compatibility (Weight: 25%)
    let p1 = 0;
    if (email && email.includes('@')) p1 += 5;
    if (phone && phone.trim().length >= 7) p1 += 5;
    if (linkedinUrl || githubUrl || portfolioUrl) p1 += 5;
    if (name && name.trim().length >= 3) p1 += 10;
    p1 = Math.min(25, p1);
    checks.push({
      id: 'parsing',
      label: 'Parsing Compatibility',
      weight: '25%',
      pts: p1,
      max: 25,
      passed: p1 >= 20,
      tip: p1 < 20 ? 'Add email, phone, or live portfolio link' : 'Verified contact headers and parseable text'
    });

    // 2. Section Structure & Organization (Weight: 20%)
    let p2 = 0;
    if (name) p2 += 4;
    if (headline && headline.trim().length >= 8) p2 += 4;
    if (summary && summary.trim().length >= 20) p2 += 4;
    if (projects.length > 0 || experience.length > 0) p2 += 4;
    if (education.length > 0) p2 += 4;
    p2 = Math.min(20, p2);
    checks.push({
      id: 'structure',
      label: 'Section Structure',
      weight: '20%',
      pts: p2,
      max: 20,
      passed: p2 >= 16,
      tip: p2 < 16 ? 'Fill out all standard sections (headline, summary, projects, education)' : 'Standard chronological multi-section structure'
    });

    // 3. Keyword Optimization (Weight: 25%)
    let p3 = 0;
    if (skills.length >= 10) p3 += 15;
    else if (skills.length >= 6) p3 += 12;
    else if (skills.length >= 3) p3 += 7;
    else if (skills.length >= 1) p3 += 4;
    p3 += (skills.length >= 8 ? 10 : 6); // Tech breadth & domain density
    p3 = Math.min(25, p3);
    checks.push({
      id: 'keywords',
      label: 'Keyword Optimization',
      weight: '25%',
      pts: p3,
      max: 25,
      passed: p3 >= 20,
      tip: p3 < 20 ? `Add ${Math.max(1, 8 - skills.length)} more skills to maximize keyword density` : `${skills.length} technical skills & framework competencies indexed`
    });

    // 4. Content Completeness (Weight: 15%)
    let p4 = 0;
    if (education.length > 0 && education.some(e => e.degree && e.institution)) {
      p4 += 5;
      if (education.some(e => e.score || e.year)) p4 += 3;
    }
    if ((projects.length > 0 || experience.length > 0) && [...projects, ...experience].some(e => e.title || e.role)) {
      p4 += 4;
      if ([...projects, ...experience].some(e => (e.description || '').length > 25)) p4 += 3;
    }
    p4 = Math.min(15, p4);
    checks.push({
      id: 'completeness',
      label: 'Content Completeness',
      weight: '15%',
      pts: p4,
      max: 15,
      passed: p4 >= 12,
      tip: p4 < 12 ? 'Include institution, degree, CGPA, and detailed project bullet points' : 'Accredited academics & documented project records'
    });

    // 5. Formatting & Readability (Weight: 15%)
    let p5 = 0;
    const allDescriptions = [
      summary,
      ...projects.map(p => (p.description || '') + ' ' + (p.tech_stack || '')),
      ...experience.map(e => e.description || '')
    ].join(' ').toLowerCase();

    const actionVerbs = ['architected', 'developed', 'built', 'reduced', 'increased', 'optimized', 'scaled', 'implemented', 'designed', 'deployed', 'engineered', 'integrated'];
    const hasActionVerbs = actionVerbs.some(v => allDescriptions.includes(v));
    const hasNumbers = /\d+%|\d+\s*(ms|k|m|users|sec|seconds|times|x|gb|mb)/i.test(allDescriptions) || /\d+/.test(allDescriptions);

    if (hasActionVerbs) p5 += 8;
    if (hasNumbers) p5 += 7;
    p5 = Math.min(15, p5);
    checks.push({
      id: 'readability',
      label: 'Formatting & Readability',
      weight: '15%',
      pts: p5,
      max: 15,
      passed: p5 >= 12,
      tip: !hasNumbers ? 'Add numbers/metrics (e.g. "reduced latency by 30%", "500+ users")' : 'Action verbs & measurable outcomes detected'
    });

    const score = Math.min(100, Math.max(20, p1 + p2 + p3 + p4 + p5));

    // Grading Brackets
    let grade = 'Excellent';
    let statusLabel = 'Excellent (ATS Optimized)';
    let statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
    let ringColor = '#10b981';

    if (score < 50) {
      grade = 'Major Issues';
      statusLabel = 'Major Issues';
      statusColor = 'text-rose-700 bg-rose-50 border-rose-200';
      ringColor = '#f43f5e';
    } else if (score < 70) {
      grade = 'Poor';
      statusLabel = 'Poor';
      statusColor = 'text-orange-700 bg-orange-50 border-orange-200';
      ringColor = '#f97316';
    } else if (score < 85) {
      grade = 'Needs Improvement';
      statusLabel = 'Needs Improvement';
      statusColor = 'text-amber-700 bg-amber-50 border-amber-200';
      ringColor = '#f59e0b';
    } else if (score < 95) {
      grade = 'Very Good';
      statusLabel = 'Very Good';
      statusColor = 'text-blue-700 bg-blue-50 border-blue-200';
      ringColor = '#3b82f6';
    }

    return { score, grade, checks, statusLabel, statusColor, ringColor };
  }, [name, email, phone, linkedinUrl, githubUrl, portfolioUrl, headline, summary, skills, projects, experience, education]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-brand-600" />
            AI Resume Builder & ATS Optimizer
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Build a clean, high-scoring ATS-compatible resume with real-time AI guidance & clickable links
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="cursor-pointer px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 shadow-xs">
            <Upload className="w-3.5 h-3.5" />
            <span>{uploading ? 'Parsing with AI...' : 'Upload Existing Resume'}</span>
            <input type="file" accept=".pdf,.docx,.doc,.txt" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            Export / Print
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-brand-500/20 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving...' : 'Save & Sync Profile'}
          </button>
        </div>
      </div>

      {/* Mobile Advisory Banner */}
      <div className="md:hidden bg-indigo-50/90 border border-indigo-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-xs no-print">
        <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 font-bold text-sm shadow-xs">
          📄
        </div>
        <div className="text-xs text-indigo-950">
          <p className="font-bold text-indigo-900">Desktop Recommended for Full A4 Preview & PDF Export</p>
          <p className="text-indigo-700/90 mt-0.5 leading-relaxed">
            You can edit sections and review AI ATS scoring on mobile. For live side-by-side A4 document layout and one-click PDF printing, opening on a PC or laptop is recommended.
          </p>
        </div>
      </div>


      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 no-print shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Real-Time Live ATS Compatibility & Resume Quality Gauge */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs no-print">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Circular SVG Gauge & Score Label */}
          <div className="flex items-center gap-5 shrink-0">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#f1f5f9"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke={liveAts.ringColor}
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - liveAts.score / 100)}`}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-500 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black tracking-tight text-slate-900 leading-none">
                  {liveAts.score}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">/ 100</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand-600" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  ATS Compatibility Score
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
                Resume Quality Index
              </h3>
              <div className="mt-1 flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${liveAts.statusColor}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                  {liveAts.statusLabel}
                </span>
              </div>
            </div>
          </div>

          {/* 5 Real-Time ATS Metric Checks */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 w-full">
            {liveAts.checks.map((chk) => (
              <div
                key={chk.id}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  chk.passed
                    ? 'bg-emerald-50/50 border-emerald-200/80'
                    : 'bg-slate-50/80 border-slate-200/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                    {chk.label}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 bg-white border border-slate-200 px-1 py-0.2 rounded shrink-0">
                    {chk.weight}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs font-black text-slate-900">
                    {chk.pts} <span className="text-[10px] text-slate-400 font-normal">/ {chk.max}</span>
                  </span>
                  {chk.passed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <span className="w-3 h-3 rounded-full border border-slate-300 shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-1 line-clamp-1" title={chk.tip}>
                  {chk.tip}
                </p>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Main Grid: Builder Form on Left, Formatted Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Form Column */}
        <div className="lg:col-span-6 space-y-6 no-print">
          
          {/* Section 1: Professional Identification & Links */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-50 text-brand-600 inline-flex items-center justify-center text-xs font-bold">1</span>
              Personal Identification & Links
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Full Name on Resume</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Chen"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Target Professional Headline</label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Software Engineer | React, Python, Node.js"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1-555-0199"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Hyderabad, India / Remote"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
            </div>

            {/* Links Section */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 mb-2">Professional Profiles & Links</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 mb-1">
                    <LinkedInIcon className="w-3.5 h-3.5 text-blue-600" />
                    <span>LinkedIn URL</span>
                  </div>
                  <input
                    type="text"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 mb-1">
                    <GitHubIcon className="w-3.5 h-3.5 text-slate-800" />
                    <span>GitHub URL</span>
                  </div>
                  <input
                    type="text"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 mb-1">
                    <Globe className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Portfolio / Site</span>
                  </div>
                  <input
                    type="text"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    placeholder="https://myportfolio.dev"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-600">Professional Summary (Pure Narrative)</label>
                <span className="text-[10px] text-slate-400">Keep contact info out of this box</span>
              </div>
              <textarea
                rows={3}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Motivated Computer Science undergraduate with hands-on experience in full-stack web applications and machine learning..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 leading-relaxed"
              />
            </div>
          </div>

          {/* Section 2: Core Competencies & Skills */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-50 text-brand-600 inline-flex items-center justify-center text-xs font-bold">2</span>
              Core Competencies & Skills
            </h3>

            <div className="flex gap-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleAddSkill}
                placeholder="Type skill (e.g. TypeScript, Docker, MongoDB) and press Enter"
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold transition"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold rounded-lg"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="hover:text-rose-600 text-slate-400 font-bold ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Section 3: Technical Projects */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-50 text-brand-600 inline-flex items-center justify-center text-xs font-bold">3</span>
                Technical Projects
              </h3>
              <button
                type="button"
                onClick={handleAddProject}
                className="text-xs font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add Project
              </button>
            </div>

            {projects.length === 0 && (
              <p className="text-xs text-slate-400 italic">No projects added yet. Click &quot;Add Project&quot; to showcase your software builds!</p>
            )}

            {projects.map((proj, idx) => (
              <div key={idx} className="p-4 bg-slate-50/70 border border-slate-200/70 rounded-2xl space-y-3 relative group">
                <button
                  type="button"
                  onClick={() => handleRemoveProject(idx)}
                  className="absolute top-3 right-3 text-slate-400 hover:text-rose-600 transition"
                  title="Remove Project"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-6">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Project Title</label>
                    <input
                      type="text"
                      value={proj.title || ''}
                      onChange={(e) => handleUpdateProject(idx, 'title', e.target.value)}
                      placeholder="e.g. Travel Booking Application"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Technologies / Stack</label>
                    <input
                      type="text"
                      value={proj.tech_stack || ''}
                      onChange={(e) => handleUpdateProject(idx, 'tech_stack', e.target.value)}
                      placeholder="React, Express, Node.js, MongoDB"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Demo / GitHub Link</label>
                  <input
                    type="text"
                    value={proj.link || ''}
                    onChange={(e) => handleUpdateProject(idx, 'link', e.target.value)}
                    placeholder="https://github.com/username/project"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Key Features & Description
                  </label>
                  <textarea
                    rows={2}
                    value={proj.description || ''}
                    onChange={(e) => handleUpdateProject(idx, 'description', e.target.value)}
                    placeholder="Built responsive UI, integrated Stripe checkout API, implemented Redis caching for 40% faster queries."
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Section 4: Work Experience & Internships */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-brand-50 text-brand-600 inline-flex items-center justify-center text-xs font-bold">4</span>
                  Work Experience & Internships
                </h3>
                <span className="text-[10px] text-slate-400 ml-8 font-medium">Optional for freshers / students</span>
              </div>
              <button
                type="button"
                onClick={handleAddExperience}
                className="text-xs font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add Position
              </button>
            </div>

            {experience.length === 0 && (
              <p className="text-xs text-slate-400 italic">No formal positions listed. As a student, your projects and education carry prime ATS weight!</p>
            )}

            {experience.map((exp, idx) => (
              <div key={idx} className="p-4 bg-slate-50/70 border border-slate-200/70 rounded-2xl space-y-3 relative group">
                <button
                  type="button"
                  onClick={() => handleRemoveExperience(idx)}
                  className="absolute top-3 right-3 text-slate-400 hover:text-rose-600 transition"
                  title="Remove Position"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="grid grid-cols-2 gap-3 pr-6">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Role / Job Title</label>
                    <input
                      type="text"
                      value={exp.title || ''}
                      onChange={(e) => handleUpdateExperience(idx, 'title', e.target.value)}
                      placeholder="Software Intern"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Company / Organization</label>
                    <input
                      type="text"
                      value={exp.company || ''}
                      onChange={(e) => handleUpdateExperience(idx, 'company', e.target.value)}
                      placeholder="Tech Innovations Ltd"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Duration</label>
                  <input
                    type="text"
                    value={exp.duration || ''}
                    onChange={(e) => handleUpdateExperience(idx, 'duration', e.target.value)}
                    placeholder="May 2024 - July 2024"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Quantified Achievements & Responsibilities
                  </label>
                  <textarea
                    rows={2}
                    value={exp.description || ''}
                    onChange={(e) => handleUpdateExperience(idx, 'description', e.target.value)}
                    placeholder="Contributed to REST API microservices, automated unit tests improving code coverage to 88%."
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Section 5: Education & Academics */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-50 text-brand-600 inline-flex items-center justify-center text-xs font-bold">5</span>
                Education & Academics
              </h3>
              <button
                type="button"
                onClick={handleAddEducation}
                className="text-xs font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add Degree
              </button>
            </div>

            {education.map((edu, idx) => (
              <div key={idx} className="p-3 bg-slate-50/70 border border-slate-200/70 rounded-2xl space-y-2 relative group">
                <button
                  type="button"
                  onClick={() => handleRemoveEducation(idx)}
                  className="absolute top-3 right-3 text-slate-400 hover:text-rose-600 transition"
                  title="Remove Education"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pr-6">
                  <input
                    type="text"
                    value={edu.degree || ''}
                    onChange={(e) => handleUpdateEducation(idx, 'degree', e.target.value)}
                    placeholder="Degree (e.g. B.Tech Computer Science)"
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    value={edu.institution || ''}
                    onChange={(e) => handleUpdateEducation(idx, 'institution', e.target.value)}
                    placeholder="Institution (e.g. VIT-AP University)"
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={edu.year || ''}
                    onChange={(e) => handleUpdateEducation(idx, 'year', e.target.value)}
                    placeholder="Year (e.g. 2022 - 2026)"
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    value={edu.score || ''}
                    onChange={(e) => handleUpdateEducation(idx, 'score', e.target.value)}
                    placeholder="Score / CGPA (e.g. CGPA: 8.5 / 10)"
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Section 6: Certifications & Credentials */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-50 text-brand-600 inline-flex items-center justify-center text-xs font-bold">6</span>
                Certifications & Achievements
              </h3>
              <button
                type="button"
                onClick={handleAddCertification}
                className="text-xs font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add Certification
              </button>
            </div>

            {certifications.length === 0 && (
              <p className="text-xs text-slate-400 italic">No certifications added yet. Click &quot;Add Certification&quot; to include AWS, Google, or Coursera credentials.</p>
            )}

            {certifications.map((cert, idx) => (
              <div key={idx} className="p-3 bg-slate-50/70 border border-slate-200/70 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-2 relative group items-center">
                <input
                  type="text"
                  value={cert.name || ''}
                  onChange={(e) => handleUpdateCertification(idx, 'name', e.target.value)}
                  placeholder="Certificate Name"
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
                <input
                  type="text"
                  value={cert.issuer || ''}
                  onChange={(e) => handleUpdateCertification(idx, 'issuer', e.target.value)}
                  placeholder="Issuer (e.g. AWS, Coursera)"
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={cert.year || ''}
                    onChange={(e) => handleUpdateCertification(idx, 'year', e.target.value)}
                    placeholder="Year (e.g. 2024)"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveCertification(idx)}
                    className="text-slate-400 hover:text-rose-600 transition shrink-0"
                    title="Remove Certification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* AI Suggestions Card */}
          <div className="bg-gradient-to-br from-indigo-50/70 to-brand-50/70 border border-brand-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  AI ATS Suggestions Generator
                </h3>
              </div>
              <button
                type="button"
                onClick={handleFetchAiSuggestions}
                disabled={loadingSuggestions}
                className="px-3 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-semibold hover:bg-brand-700 transition disabled:opacity-50"
              >
                {loadingSuggestions ? 'Analyzing...' : 'Generate AI Advice'}
              </button>
            </div>

            {suggestions.length > 0 ? (
              <div className="space-y-2.5">
                {suggestions.map((item, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200/60 text-xs text-slate-800">
                    <span className="font-bold text-brand-700 block mb-0.5">{item.category}</span>
                    <p className="leading-snug">{item.advice}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Click &quot;Generate AI Advice&quot; to inspect keyword density, metric presence, and ATS formatting recommendations.
              </p>
            )}
          </div>

        </div>

        {/* Live Formatted Resume Preview */}
        <div className="lg:col-span-6 print-full-width">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-2xl shadow-subtle border border-slate-200/90 bg-white p-8 sm:p-10 text-slate-900 font-serif print-resume-sheet">
            
            {/* Header / Contact Area */}
            <div className="border-b-2 border-slate-800 pb-4 text-center">
              <h1 className="text-2xl font-bold font-sans tracking-tight text-slate-900">
                {name || 'Alex Chen'}
              </h1>
              <p className="text-xs font-sans font-semibold text-brand-700 mt-1">
                {headline || 'Software Engineer'}
              </p>
              
              {/* Primary Contact Bar */}
              <div className="text-[11px] font-sans text-slate-600 mt-2 flex flex-wrap justify-center items-center gap-2 sm:gap-3">
                {email && <span>{email}</span>}
                {email && phone && <span>•</span>}
                {phone && <span>{phone}</span>}
                {location && (
                  <>
                    <span>•</span>
                    <span>{location}</span>
                  </>
                )}
              </div>

              {/* Clickable Social & Web Profiles */}
              {(linkedinUrl || githubUrl || portfolioUrl) && (
                <div className="text-[11px] font-sans text-slate-700 mt-2 flex flex-wrap justify-center items-center gap-3 pt-1 border-t border-slate-100">
                  {linkedinUrl && (
                    <a
                      href={sanitizeUrl(linkedinUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900 hover:underline font-semibold"
                    >
                      <LinkedInIcon className="w-3 h-3" />
                      <span>LinkedIn Profile</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                    </a>
                  )}

                  {githubUrl && (
                    <a
                      href={sanitizeUrl(githubUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-slate-800 hover:text-slate-950 hover:underline font-semibold"
                    >
                      <GitHubIcon className="w-3 h-3" />
                      <span>GitHub Portfolio</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                    </a>
                  )}

                  {portfolioUrl && (
                    <a
                      href={sanitizeUrl(portfolioUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-indigo-700 hover:text-indigo-900 hover:underline font-semibold"
                    >
                      <Globe className="w-3 h-3" />
                      <span>Personal Portfolio</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Summary */}
            {summary && (
              <div className="mt-5">
                <h3 className="font-sans text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1 mb-2">
                  Professional Summary
                </h3>
                <p className="text-xs text-slate-700 leading-relaxed font-sans text-justify">
                  {summary}
                </p>
              </div>
            )}

            {/* Skills */}
            {skills.length > 0 && (
              <div className="mt-5">
                <h3 className="font-sans text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1 mb-2">
                  Technical Competencies
                </h3>
                <div className="flex flex-wrap gap-1.5 font-sans">
                  {skills.map((s, idx) => (
                    <span key={idx} className="text-xs bg-slate-100 px-2 py-0.5 rounded font-medium text-slate-800">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Technical Projects */}
            {projects.length > 0 && (
              <div className="mt-5">
                <h3 className="font-sans text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1 mb-2">
                  Technical Projects
                </h3>
                <div className="space-y-3 font-sans">
                  {projects.map((proj, idx) => (
                    <div key={idx} className="break-inside-avoid">
                      <div className="flex justify-between items-baseline text-xs">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{proj.title || 'Software Project'}</span>
                          {proj.link && (
                            <a
                              href={sanitizeUrl(proj.link)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-brand-600 hover:text-brand-800 inline-flex items-center"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        {proj.tech_stack && (
                          <span className="text-[11px] text-slate-500 italic font-normal">
                            {proj.tech_stack}
                          </span>
                        )}
                      </div>
                      {proj.description && (
                        <p className="text-xs text-slate-700 mt-1 leading-relaxed whitespace-pre-line text-justify">
                          {proj.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Work Experience */}
            {experience.length > 0 && (
              <div className="mt-5">
                <h3 className="font-sans text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1 mb-2">
                  Professional Experience & Internships
                </h3>
                <div className="space-y-3.5 font-sans">
                  {experience.map((exp, idx) => (
                    <div key={idx} className="break-inside-avoid">
                      <div className="flex justify-between items-baseline text-xs">
                        <span className="font-bold text-slate-900">{exp.title || 'Engineer / Intern'}</span>
                        <span className="text-slate-500 text-[11px]">{exp.duration}</span>
                      </div>
                      <div className="text-xs font-semibold text-brand-700">{exp.company}</div>
                      {exp.description && (
                        <p className="text-xs text-slate-700 mt-1 leading-relaxed whitespace-pre-line text-justify">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {education.length > 0 && (
              <div className="mt-5">
                <h3 className="font-sans text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1 mb-2">
                  Education & Credentials
                </h3>
                <div className="space-y-3 font-sans">
                  {education.map((edu, idx) => (
                    <div key={idx} className="text-xs break-inside-avoid">
                      <div className="flex justify-between items-baseline">
                        <span className="font-bold text-slate-900">{edu.degree}</span>
                        <span className="text-slate-500 text-[11px] shrink-0 ml-2">{edu.year}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-600 mt-0.5">
                        <span>{edu.institution}</span>
                        {edu.score && <span className="text-brand-700 font-semibold text-[11px]">{edu.score}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {certifications.length > 0 && (
              <div className="mt-5">
                <h3 className="font-sans text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1 mb-2">
                  Certifications & Honors
                </h3>
                <div className="space-y-1.5 font-sans">
                  {certifications.map((cert, idx) => (
                    <div key={idx} className="flex justify-between text-xs break-inside-avoid">
                      <div>
                        <span className="font-bold text-slate-900">{cert.name}</span>
                        {cert.issuer && <span> — {cert.issuer}</span>}
                      </div>
                      <span className="text-slate-500 text-[11px]">{cert.year}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
}
