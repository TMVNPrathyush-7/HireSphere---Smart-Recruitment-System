import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/Badge';
import { TableRowSkeleton } from '../../components/common/Skeleton';
import {
  Briefcase,
  Users,
  Calendar,
  Sparkles,
  Plus,
  Eye,
  CheckCircle2,
  Trash2,
  Building,
  MapPin,
  Clock,
  Layers
} from 'lucide-react';

export function RecruiterDashboard() {
  const { user, profile } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  
  // Job Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requiredSkills, setRequiredSkills] = useState(['React', 'Node.js', 'PostgreSQL']);
  const [skillInput, setSkillInput] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('Senior (3-5 years)');
  const [jobLocation, setJobLocation] = useState('Remote / Hybrid');
  const [employmentType, setEmploymentType] = useState('full-time');
  const getDefaultDeadline = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  };
  const [deadline, setDeadline] = useState(getDefaultDeadline());
  const [posting, setPosting] = useState(false);

  const fetchJobs = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const data = await api.jobs.getRecruiterJobs(profile.id);
      setJobs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [profile]);

  const handleAddSkill = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      e.preventDefault();
      const val = skillInput.trim();
      if (val && !requiredSkills.includes(val)) {
        setRequiredSkills([...requiredSkills, val]);
        setSkillInput('');
      }
    }
  };

  const handleRemoveSkill = (skill) => {
    setRequiredSkills(requiredSkills.filter(s => s !== skill));
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setPosting(true);
    try {
      await api.jobs.create({
        title,
        description,
        required_skills: requiredSkills,
        experience_level: experienceLevel,
        location: jobLocation,
        employment_type: employmentType,
        deadline
      });
      setCreateModalOpen(false);
      setTitle('');
      setDescription('');
      setDeadline(getDefaultDeadline());
      fetchJobs();
    } catch (err) {
      alert(err.message || 'Error posting job');
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to close and delete this job posting?')) return;
    try {
      await api.jobs.delete(jobId);
      fetchJobs();
    } catch (e) {
      alert(e.message || 'Error deleting job');
    }
  };

  const totalApplicants = jobs.reduce((acc, j) => acc + (j.applicant_count || 0), 0);
  const totalShortlisted = jobs.reduce((acc, j) => acc + (j.shortlisted_count || 0), 0);
  const totalInterviews = jobs.reduce((acc, j) => acc + (j.interview_count || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white border border-slate-800/80 shadow-xs relative overflow-hidden flex flex-wrap items-center justify-between gap-6">
        <div>
          <span className="px-3 py-1 bg-white/10 text-white/90 rounded-full text-xs font-semibold tracking-wide uppercase border border-white/10 inline-block mb-3">
            Recruiter & Employer Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display">
            {profile?.company_name || 'Organization'} Hiring Pipeline
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">
            Automate resume screening, calculate ATS compatibility, and rank candidates automatically with AI.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-5 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-brand-500/25 shrink-0"
        >
          <Plus className="w-4 h-4" /> Post New Job
        </button>
      </div>

      {/* Metrics Row - Interactive Pipeline Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => document.getElementById('job-openings')?.scrollIntoView({ behavior: 'smooth' })}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-brand-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-brand-600 transition-colors">
              Active Jobs
            </span>
            <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center group-hover:bg-brand-600 group-hover:text-white transition-colors">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{jobs.length}</p>
          <span className="text-[11px] font-semibold text-slate-400 mt-1 block">
            Click to view postings ↓
          </span>
        </div>

        <div
          onClick={() => document.getElementById('job-openings')?.scrollIntoView({ behavior: 'smooth' })}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-indigo-600 transition-colors">
              Total Applicants
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{totalApplicants}</p>
          <span className="text-[11px] font-semibold text-indigo-600 mt-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> AI Ranked in Pipeline
          </span>
        </div>

        <div
          onClick={() => document.getElementById('job-openings')?.scrollIntoView({ behavior: 'smooth' })}
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-emerald-600 transition-colors">
              Shortlisted
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{totalShortlisted}</p>
          <span className="text-[11px] font-semibold text-emerald-600 mt-1 block">
            High Composite Matches
          </span>
        </div>

        <Link
          to="/recruiter/interviews"
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-purple-300 hover:shadow-md transition-all group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-purple-600 transition-colors">
              Interviews Scheduled
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{totalInterviews}</p>
          <span className="text-[11px] font-semibold text-purple-600 mt-1 flex items-center gap-1 group-hover:underline">
            Manage Slots & Meets →
          </span>
        </Link>
      </div>

      {/* Posted Jobs Table */}
      <div id="job-openings" className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight font-display">
              My Job Openings
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select a job to inspect AI-ranked applicants and schedule interview slots
            </p>
          </div>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="text-xs font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Post Job
          </button>
        </div>

        {loading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 px-3">Job Title & Details</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3">Total Applicants</th>
                  <th className="pb-3 px-3">Shortlisted</th>
                  <th className="pb-3 px-3">Interviews</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <TableRowSkeleton cols={6} rows={3} />
            </table>
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl">
            No job openings posted yet. Post your first job to receive AI-screened candidate submissions!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 px-3">Job Title & Details</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3">Total Applicants</th>
                  <th className="pb-3 px-3">Shortlisted</th>
                  <th className="pb-3 px-3">Interviews</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-4 px-3">
                      <div className="font-bold text-slate-900 text-sm">{job.title}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>{job.location}</span>
                        <span>•</span>
                        <span>{job.experience_level}</span>
                        {job.deadline && (
                          <>
                            <span>•</span>
                            <span className="text-brand-700 font-medium flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-brand-500" />
                              Deadline: {new Date(job.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-3">
                      <StatusBadge status={job.status} />
                    </td>

                    <td className="py-4 px-3">
                      <span className="font-extrabold text-slate-900 text-sm">
                        {job.applicant_count || 0}
                      </span>
                    </td>

                    <td className="py-4 px-3">
                      <span className="font-bold text-purple-700 text-sm">
                        {job.shortlisted_count || 0}
                      </span>
                    </td>

                    <td className="py-4 px-3">
                      <span className="font-bold text-indigo-700 text-sm">
                        {job.interview_count || 0}
                      </span>
                    </td>

                    <td className="py-4 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/recruiter/jobs/${job.id}/applicants`}
                          className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-xl text-xs font-bold transition flex items-center gap-1 border border-brand-200"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Ranked Applicants
                        </Link>
                        <button
                          onClick={() => handleDeleteJob(job.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                          title="Delete Job"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Job Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">
                Post a New Opportunity
              </h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Position Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Senior Backend Engineer"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Job Description</label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the responsibilities, team impact, and day-to-day work..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Required Skills (Used for AI semantic matching)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleAddSkill}
                    placeholder="Type skill and press Add"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="px-3 py-2 bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {requiredSkills.map((s, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 bg-brand-50 text-brand-700 text-xs px-2.5 py-0.5 rounded-lg border border-brand-200 font-medium">
                      {s}
                      <button type="button" onClick={() => handleRemoveSkill(s)} className="text-slate-400 hover:text-rose-600">×</button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Experience Level</label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="Junior (0-2 years)">Junior (0-2 years)</option>
                    <option value="Mid-Level (2-4 years)">Mid-Level (2-4 years)</option>
                    <option value="Senior (4-7 years)">Senior (4-7 years)</option>
                    <option value="Lead / Staff (7+ years)">Lead / Staff (7+ years)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Employment Type</label>
                  <select
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={jobLocation}
                    onChange={(e) => setJobLocation(e.target.value)}
                    placeholder="e.g. San Francisco, CA / Remote"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Application Deadline</label>
                  <input
                    type="date"
                    required
                    value={deadline}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={posting}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 disabled:opacity-50"
                >
                  {posting ? 'Publishing...' : 'Publish Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
