import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, ScoreBadge } from '../../components/common/Badge';
import { JobCardSkeleton, Skeleton } from '../../components/common/Skeleton';
import {
  Search,
  MapPin,
  Briefcase,
  Building,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Filter,
  Clock,
  Calendar
} from 'lucide-react';

const getDeadlineStatus = (deadline) => {
  if (!deadline) return null;
  const target = new Date(deadline);
  target.setHours(23, 59, 59, 999);
  const now = new Date();
  const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  const isExpired = diffDays <= 0;
  return {
    formatted: target.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    diffDays,
    isExpired
  };
};

export function JobBrowse() {
  const { user, profile, isCandidate } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [skill, setSkill] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [skillGapData, setSkillGapData] = useState(null);
  const [gapLoading, setGapLoading] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applySuccess, setApplySuccess] = useState('');
  const [applyError, setApplyError] = useState('');
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'high_match', 'remote', 'junior'
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    if (!profile?.id || !isCandidate) return;
    try {
      const apps = await api.applications.getCandidateApplications(profile.id);
      const ids = new Set((apps || []).map(a => a.job_id));
      setAppliedJobIds(ids);
    } catch (e) {
      console.warn('Failed to fetch existing candidate applications:', e);
    }
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const data = await api.jobs.getAll({ search, location, skill });
      setJobs(data);
      if (data.length > 0 && !selectedJob) {
        setSelectedJob(data[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [search, location, skill]);

  useEffect(() => {
    fetchApplications();
  }, [profile, isCandidate]);

  // When selectedJob changes, run AI skill gap analysis for candidate and reset messages
  useEffect(() => {
    setApplySuccess('');
    setApplyError('');
    if (selectedJob && profile && isCandidate) {
      runSkillGap(selectedJob.id);
    }
  }, [selectedJob, profile]);

  const runSkillGap = async (jobId) => {
    setGapLoading(true);
    setSkillGapData(null);
    try {
      const data = await api.resumes.getSkillGap(profile.id, jobId);
      setSkillGapData(data);
    } catch (e) {
      console.warn('Skill gap error:', e);
    } finally {
      setGapLoading(false);
    }
  };

  const handleApply = async (jobId) => {
    setApplyLoading(true);
    setApplySuccess('');
    setApplyError('');
    try {
      const res = await api.applications.apply(jobId);
      setAppliedJobIds(prev => new Set([...prev, jobId]));
      const composite = Math.round((res.application.ats_score * 0.4) + (res.application.skill_match_score * 0.6));
      setApplySuccess(`Application submitted successfully! Evaluated: ${res.application.ats_score}% ATS Compatibility, ${res.application.skill_match_score}% Skill Match (Composite Rank: ${composite}%).`);
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes('already applied')) {
        setAppliedJobIds(prev => new Set([...prev, jobId]));
      }
      setApplyError(err.message || 'Failed to submit application');
    } finally {
      setApplyLoading(false);
    }
  };

  const getJobMatchScore = (job) => {
    if (!profile?.skills || !Array.isArray(job.required_skills) || job.required_skills.length === 0) {
      return 0;
    }
    const candLower = (profile.skills || []).map(s => String(s).toLowerCase());
    const matched = job.required_skills.filter(req => {
      const r = String(req).toLowerCase();
      return candLower.some(c => c === r || c.includes(r) || r.includes(c));
    });
    return Math.round((matched.length / job.required_skills.length) * 100);
  };

  const filteredJobs = jobs.filter(job => {
    if (activeFilter === 'high_match') {
      return getJobMatchScore(job) >= 65;
    }
    if (activeFilter === 'remote') {
      return (job.location || '').toLowerCase().includes('remote');
    }
    if (activeFilter === 'junior') {
      const exp = (job.experience_level || '').toLowerCase();
      return exp.includes('junior') || exp.includes('0-2') || exp.includes('1-3') || exp.includes('entry');
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Search & Filter Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs mb-6">
        <div className="max-w-2xl mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-display">
            Explore Open Tech Positions
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse verified opportunities and inspect real-time AI skill matching before applying
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, role or company..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
            />
          </div>

          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Filter by location (e.g. Remote, CA)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
            />
          </div>

          <div className="relative">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              placeholder="Filter by skill (e.g. React, Python)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
            />
          </div>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Quick Filters:
          </span>
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              activeFilter === 'all'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            All Openings ({jobs.length})
          </button>
          {isCandidate && (
            <button
              type="button"
              onClick={() => setActiveFilter('high_match')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                activeFilter === 'high_match'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              ⚡ High Match (≥65%)
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveFilter('remote')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              activeFilter === 'remote'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            🌐 Remote / Hybrid
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('junior')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              activeFilter === 'junior'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            🎓 Junior / Entry-Level
          </button>
        </div>
      </div>

      {/* Main Grid: Job Cards List + Selected Job Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Job List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {filteredJobs.length} Positions Available
            </span>
          </div>

          {loading ? (
            <div className="space-y-3">
              <JobCardSkeleton />
              <JobCardSkeleton />
              <JobCardSkeleton />
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="p-12 bg-white rounded-3xl border border-slate-100 text-center text-slate-500 text-sm">
              No jobs found matching your criteria.
            </div>
          ) : (
            filteredJobs.map((job) => (
              <div
                key={job.id}
                onClick={() => setSelectedJob(job)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer bg-white ${
                  selectedJob?.id === job.id
                    ? 'border-brand-500 shadow-md shadow-brand-500/10 ring-1 ring-brand-500/30'
                    : 'border-slate-200/80 hover:border-slate-300 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base leading-tight">
                      {job.title}
                    </h3>
                    <p className="text-xs text-brand-700 font-semibold mt-1 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-brand-600" />
                      {job.company_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {appliedJobIds.has(job.id) && (
                      <span className="text-[10px] font-bold bg-emerald-100/90 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Applied
                      </span>
                    )}
                    <StatusBadge status={job.status} />
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {job.location}
                  </span>
                  <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md capitalize">
                    <Briefcase className="w-3 h-3 text-slate-400" />
                    {job.employment_type}
                  </span>
                  <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {job.experience_level}
                  </span>
                  {job.deadline && (() => {
                    const dl = getDeadlineStatus(job.deadline);
                    if (!dl) return null;
                    if (dl.isExpired) {
                      return (
                        <span className="flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-md font-bold text-[10px]">
                          <Calendar className="w-3 h-3 text-rose-500" />
                          Deadline Passed
                        </span>
                      );
                    }
                    if (dl.diffDays <= 3) {
                      return (
                        <span className="flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md font-bold text-[10px]">
                          <Clock className="w-3 h-3 text-amber-600" />
                          {dl.diffDays === 1 ? 'Closes Today' : `${dl.diffDays} Days Left`}
                        </span>
                      );
                    }
                    return (
                      <span className="flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200/60 px-2 py-0.5 rounded-md font-medium text-[10px]">
                        <Calendar className="w-3 h-3 text-indigo-500" />
                        Apply by {dl.formatted}
                      </span>
                    );
                  })()}
                  {isCandidate && profile?.skills && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                      getJobMatchScore(job) >= 65
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : getJobMatchScore(job) >= 40
                        ? 'bg-brand-50 text-brand-700 border-brand-200'
                        : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}>
                      <Sparkles className="w-2.5 h-2.5" />
                      {getJobMatchScore(job)}% Match
                    </span>
                  )}
                </div>

                {job.required_skills && job.required_skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {job.required_skills.slice(0, 4).map((s, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-medium bg-brand-50 text-brand-700 px-2 py-0.5 rounded-md border border-brand-100"
                      >
                        {s}
                      </span>
                    ))}
                    {job.required_skills.length > 4 && (
                      <span className="text-[11px] text-slate-400 px-1 py-0.5">
                        +{job.required_skills.length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Right: Selected Job Details & AI Skill Gap Engine */}
        <div className="lg:col-span-7">
          {selectedJob ? (
            <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs sticky top-24 space-y-6">
              
              {/* Top Banner */}
              <div className="border-b border-slate-100 pb-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-display">
                      {selectedJob.title}
                    </h2>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                      <span className="font-semibold text-brand-700">{selectedJob.company_name}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <MapPin className="w-3.5 h-3.5" />
                        {selectedJob.location}
                      </span>
                      {selectedJob.deadline && (() => {
                        const dl = getDeadlineStatus(selectedJob.deadline);
                        if (!dl) return null;
                        return (
                          <>
                            <span>•</span>
                            <span className={`flex items-center gap-1 font-semibold text-xs ${
                              dl.isExpired ? 'text-rose-600' : dl.diffDays <= 3 ? 'text-amber-700' : 'text-indigo-600'
                            }`}>
                              <Calendar className="w-3.5 h-3.5" />
                              {dl.isExpired ? 'Deadline Passed' : `Apply by: ${dl.formatted} (${dl.diffDays} days left)`}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {isCandidate && (
                    appliedJobIds.has(selectedJob.id) ? (
                      <div className="px-4 py-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs shrink-0 cursor-default">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Applied</span>
                      </div>
                    ) : getDeadlineStatus(selectedJob.deadline)?.isExpired ? (
                      <div className="px-4 py-2.5 bg-slate-100 border border-slate-300 text-slate-500 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs shrink-0 cursor-not-allowed">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>Deadline Expired</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleApply(selectedJob.id)}
                        disabled={applyLoading}
                        className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-brand-500/20 transition disabled:opacity-50 flex items-center gap-2 shrink-0"
                      >
                        <Sparkles className="w-4 h-4" />
                        {applyLoading ? 'Evaluating...' : 'Apply with Profile'}
                      </button>
                    )
                  )}
                </div>

                {applySuccess && (
                  <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{applySuccess}</span>
                  </div>
                )}

                {applyError && (
                  <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{applyError}</span>
                  </div>
                )}
              </div>

              {/* AI Skill-Gap Analysis Card (PRD Core Value-Add) */}
              {isCandidate && (
                <div className="bg-gradient-to-br from-indigo-50/70 via-brand-50/50 to-white border border-brand-200 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center shadow-xs">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        AI Skill-Gap & ATS Alignment
                      </h4>
                    </div>

                    {skillGapData && (
                      <ScoreBadge score={skillGapData.match_percentage} label="Profile Match" />
                    )}
                  </div>

                  {gapLoading ? (
                    <div className="space-y-3 animate-pulse py-2">
                      <div className="h-3.5 bg-slate-200/80 rounded w-1/4" />
                      <div className="flex gap-2">
                        <div className="h-6 w-20 bg-emerald-100/70 rounded-md" />
                        <div className="h-6 w-24 bg-emerald-100/70 rounded-md" />
                        <div className="h-6 w-16 bg-emerald-100/70 rounded-md" />
                      </div>
                      <div className="h-3.5 bg-slate-200/80 rounded w-1/4 mt-2" />
                      <div className="flex gap-2">
                        <div className="h-6 w-24 bg-amber-100/70 rounded-md" />
                        <div className="h-6 w-20 bg-amber-100/70 rounded-md" />
                      </div>
                    </div>
                  ) : skillGapData ? (
                    <div className="space-y-3">
                      {/* Matched Skills */}
                      <div>
                        <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Matched Skills ({skillGapData.matched_skills.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {skillGapData.matched_skills.map((s, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-emerald-100/70 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md font-medium"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Missing Skills & Recommendations */}
                      {skillGapData.missing_skills.length > 0 && (
                        <div className="pt-2 border-t border-brand-100">
                          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Target Skill Gaps ({skillGapData.missing_skills.length})
                          </span>
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {skillGapData.missing_skills.map((s, idx) => (
                              <span
                                key={idx}
                                className="text-xs bg-amber-100/70 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md font-medium"
                              >
                                {s}
                              </span>
                            ))}
                          </div>

                          {/* Curated Pathways */}
                          <div className="space-y-1.5 mt-2">
                            {skillGapData.recommendations.slice(0, 2).map((rec, idx) => (
                              <div
                                key={idx}
                                className="text-[11px] text-slate-700 bg-white/80 p-2 rounded-lg border border-slate-200/60 flex items-start gap-1.5"
                              >
                                <BookOpen className="w-3.5 h-3.5 text-brand-600 shrink-0 mt-0.5" />
                                <span>
                                  <strong>{rec.skill}:</strong> {rec.recommendation}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">Add skills to your profile to see real-time skill matching.</p>
                  )}
                </div>
              )}

              {/* Job Description */}
              <div>
                <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-2">
                  Job Description
                </h4>
                <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  {selectedJob.description}
                </div>
              </div>

              {/* Requirements & Skills */}
              <div>
                <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-2">
                  Required Competencies
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.required_skills?.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Company Info */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Industry: {selectedJob.industry || 'Technology'}</span>
                {selectedJob.company_website && (
                  <a
                    href={selectedJob.company_website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-600 hover:underline font-semibold"
                  >
                    Visit Company Site →
                  </a>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-100">
              Select a position to view job description and AI matching analysis
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
