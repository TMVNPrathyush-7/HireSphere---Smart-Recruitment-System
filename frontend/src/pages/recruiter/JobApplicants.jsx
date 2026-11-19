import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { StatusBadge, ScoreBadge } from '../../components/common/Badge';
import { TableRowSkeleton } from '../../components/common/Skeleton';
import {
  ArrowLeft,
  Sparkles,
  Calendar,
  FileText,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Check,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export function JobApplicants() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [proposeModalOpen, setProposeModalOpen] = useState(false);
  const [targetApplication, setTargetApplication] = useState(null);
  
  // Propose interview modal state
  const [slot1, setSlot1] = useState('');
  const [slot2, setSlot2] = useState('');
  const [interviewMode, setInterviewMode] = useState('online');
  const [meetingLink, setMeetingLink] = useState('https://meet.google.com/abc-recruit-demo');
  const [notes, setNotes] = useState('Technical interview focused on architecture and systems.');
  const [scheduling, setScheduling] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [jobData, appsData] = await Promise.all([
        api.jobs.getById(jobId),
        api.applications.getJobApplications(jobId)
      ]);
      setJob(jobData);
      setApplicants(appsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [jobId]);

  const handleUpdateStatus = async (appId, newStatus) => {
    try {
      await api.applications.updateStatus(appId, newStatus);
      setSuccessMsg(`Status updated to ${newStatus}`);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e) {
      alert(e.message || 'Error updating status');
    }
  };

  const handleOpenProposeModal = (app) => {
    setTargetApplication(app);
    // prefill default date slots (e.g. tomorrow and day after tomorrow at 10:00 AM)
    const d1 = new Date(Date.now() + 86400000 * 2);
    d1.setHours(10, 0, 0, 0);
    const d2 = new Date(Date.now() + 86400000 * 3);
    d2.setHours(14, 0, 0, 0);
    setSlot1(d1.toISOString().slice(0, 16));
    setSlot2(d2.toISOString().slice(0, 16));
    setProposeModalOpen(true);
  };

  const handleProposeInterview = async (e) => {
    e.preventDefault();
    if (!targetApplication) return;
    setScheduling(true);

    try {
      const proposed = [];
      if (slot1) proposed.push(new Date(slot1).toISOString());
      if (slot2) proposed.push(new Date(slot2).toISOString());

      await api.interviews.propose({
        application_id: targetApplication.id,
        proposed_slots: proposed,
        interview_mode: interviewMode,
        meeting_link: meetingLink,
        notes: notes
      });

      setProposeModalOpen(false);
      setSuccessMsg('Interview slots proposed and candidate notified!');
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.message || 'Error scheduling interview');
    } finally {
      setScheduling(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Header */}
      <div>
        <Link
          to="/recruiter/dashboard"
          className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-brand-600" />
              AI Candidate Ranking & ATS Pipeline
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Position: <strong className="text-slate-800">{job?.title}</strong> • Candidates ranked by weighted composite score
            </p>
          </div>
          <span className="text-xs font-bold bg-brand-50 text-brand-700 px-3 py-1 rounded-xl border border-brand-200">
            {applicants.length} Total Applicants
          </span>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 px-3">AI Rank</th>
                  <th className="pb-3 px-3">Candidate</th>
                  <th className="pb-3 px-3">ATS Compatibility (40%)</th>
                  <th className="pb-3 px-3">Skill Match (60%)</th>
                  <th className="pb-3 px-3">Composite Score</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3">Actions</th>
                </tr>
              </thead>
              <TableRowSkeleton cols={7} rows={3} />
            </table>
          </div>
        ) : applicants.length === 0 ? (
          <div className="p-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl">
            No candidates have applied to this position yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 px-3">AI Rank</th>
                  <th className="pb-3 px-3">Candidate</th>
                  <th className="pb-3 px-3">ATS Score (40%)</th>
                  <th className="pb-3 px-3">Skill Match (60%)</th>
                  <th className="pb-3 px-3">Composite Score</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applicants.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/60 transition group">
                    <td className="py-4 px-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                        app.rank_position === 1
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : app.rank_position === 2
                          ? 'bg-slate-200 text-slate-800 border border-slate-300'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        #{app.rank_position || 1}
                      </div>
                    </td>

                    <td className="py-4 px-3">
                      <div
                        onClick={() => setSelectedApplicant(app)}
                        className="cursor-pointer"
                      >
                        <div className="font-bold text-slate-900 group-hover:text-brand-600 transition flex items-center gap-1.5">
                          {app.candidate_name}
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
                        </div>
                        <div className="text-xs text-slate-500 truncate max-w-xs">{app.candidate_headline || app.candidate_email}</div>
                      </div>
                    </td>

                    <td className="py-4 px-3">
                      <ScoreBadge score={app.ats_score} label="ATS" size="sm" />
                    </td>

                    <td className="py-4 px-3">
                      <ScoreBadge score={app.skill_match_score} label="Skills" size="sm" />
                    </td>

                    <td className="py-4 px-3">
                      <div className="font-extrabold text-brand-700 text-base">
                        {app.composite_score}%
                      </div>
                    </td>

                    <td className="py-4 px-3">
                      <select
                        value={app.status}
                        onChange={(e) => handleUpdateStatus(app.id, e.target.value)}
                        className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      >
                        <option value="applied">Applied</option>
                        <option value="under_review">Under Review</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="interview_scheduled">Interview Scheduled</option>
                        <option value="rejected">Rejected</option>
                        <option value="hired">Hired</option>
                      </select>
                    </td>

                    <td className="py-4 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedApplicant(app)}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                        >
                          Profile
                        </button>

                        <button
                          onClick={() => handleOpenProposeModal(app)}
                          className="px-3 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-2xs flex items-center gap-1"
                        >
                          <Calendar className="w-3 h-3" />
                          Interview
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

      {/* Candidate Profile Details Drawer / Modal */}
      {selectedApplicant && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-extrabold text-slate-900">{selectedApplicant.candidate_name}</h2>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full border border-brand-200">
                    Rank #{selectedApplicant.rank_position}
                  </span>
                </div>
                <p className="text-xs text-brand-600 font-semibold mt-0.5">{selectedApplicant.candidate_headline}</p>
                
                {/* Contact info */}
                <div className="text-xs text-slate-500 mt-2 flex flex-wrap items-center gap-3">
                  <span>{selectedApplicant.candidate_email}</span>
                  {selectedApplicant.candidate_phone && (
                    <>
                      <span>•</span>
                      <span>{selectedApplicant.candidate_phone}</span>
                    </>
                  )}
                </div>

                {/* Social & Portfolio Links */}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {selectedApplicant.candidate_github && (
                    <a
                      href={selectedApplicant.candidate_github}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition shadow-xs"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                      </svg>
                      GitHub Profile
                    </a>
                  )}

                  {selectedApplicant.candidate_linkedin && (
                    <a
                      href={selectedApplicant.candidate_linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 bg-[#0A66C2] hover:bg-[#004182] text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition shadow-xs"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                      </svg>
                      LinkedIn
                    </a>
                  )}

                  {(selectedApplicant.resume_snapshot_url || selectedApplicant.resume_file_url) && (
                    <a
                      href={selectedApplicant.resume_snapshot_url || selectedApplicant.resume_file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
                    >
                      <FileText className="w-3.5 h-3.5 text-brand-600" />
                      View Original PDF
                    </a>
                  )}
                </div>
              </div>

              <button
                onClick={() => setSelectedApplicant(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center font-bold text-sm transition"
              >
                ✕
              </button>
            </div>

            {/* Score Breakdown (5-Factor Aligned) */}
            <div className="grid grid-cols-3 gap-3 bg-gradient-to-br from-indigo-50/60 to-brand-50/60 p-4 rounded-2xl border border-brand-200/60 text-center">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">ATS Compatibility</span>
                <p className="text-xl font-black text-emerald-700 mt-0.5">{selectedApplicant.ats_score}%</p>
                <span className="text-[10px] font-semibold text-emerald-600">
                  {selectedApplicant.ats_score >= 95 ? 'Excellent' : selectedApplicant.ats_score >= 85 ? 'Very Good' : 'Needs Work'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Skill Match</span>
                <p className="text-xl font-black text-brand-700 mt-0.5">{selectedApplicant.skill_match_score}%</p>
                <span className="text-[10px] font-semibold text-brand-600">Target Role</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Composite Rank</span>
                <p className="text-xl font-black text-indigo-700 mt-0.5">#{selectedApplicant.rank_position}</p>
                <span className="text-[10px] font-semibold text-indigo-600">{selectedApplicant.composite_score}% Weighted</span>
              </div>
            </div>

            {/* Professional Summary (if available) */}
            {selectedApplicant.candidate_summary && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Professional Summary
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {selectedApplicant.candidate_summary}
                </p>
              </div>
            )}

            {/* Skills */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                Technical Competencies ({selectedApplicant.candidate_skills?.length || 0})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedApplicant.candidate_skills?.map((s, idx) => (
                  <span key={idx} className="text-xs bg-slate-100 text-slate-800 border border-slate-200/60 px-2.5 py-1 rounded-lg font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Technical Projects (Crucial for students and engineers!) */}
            {selectedApplicant.candidate_projects?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-brand-600" />
                  Key Projects & Systems Built ({selectedApplicant.candidate_projects.length})
                </h4>
                <div className="space-y-3">
                  {selectedApplicant.candidate_projects.map((proj, idx) => (
                    <div key={idx} className="text-xs bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1.5">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span className="text-sm font-extrabold text-slate-900">{proj.title}</span>
                        {proj.link && (
                          <a
                            href={proj.link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-brand-600 hover:text-brand-800 flex items-center gap-1 text-[11px]"
                          >
                            Live Project <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      {proj.tech_stack && (
                        <div className="flex flex-wrap gap-1">
                          {proj.tech_stack.split(',').map((tech, tIdx) => (
                            <span key={tIdx} className="text-[10px] font-semibold bg-brand-50 text-brand-700 px-2 py-0.5 rounded-md border border-brand-100">
                              {tech.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-slate-600 leading-relaxed pt-0.5">{proj.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Work Experience (if any) */}
            {selectedApplicant.candidate_work_experience?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Work Experience
                </h4>
                <div className="space-y-3">
                  {selectedApplicant.candidate_work_experience.map((exp, idx) => (
                    <div key={idx} className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>{exp.title}</span>
                        <span className="text-slate-400 text-[11px]">{exp.duration}</span>
                      </div>
                      <div className="text-brand-600 font-semibold">{exp.company}</div>
                      <p className="text-slate-600 mt-1 leading-relaxed">{exp.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education with CGPA */}
            {selectedApplicant.candidate_education?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Academic Credentials
                </h4>
                <div className="space-y-2">
                  {selectedApplicant.candidate_education.map((edu, idx) => (
                    <div key={idx} className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900">{edu.degree}</span>
                        <span className="text-slate-500 block text-[11px] mt-0.5">{edu.institution}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 text-[11px] block">{edu.year}</span>
                        {edu.score && (
                          <span className="text-brand-700 font-bold text-xs">{edu.score}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const target = selectedApplicant;
                  setSelectedApplicant(null);
                  handleOpenProposeModal(target);
                }}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
              >
                <Calendar className="w-3.5 h-3.5" />
                Schedule Interview
              </button>

              <button
                onClick={() => setSelectedApplicant(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Propose Interview Slots Modal */}
      {proposeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Propose Interview Slots
                </h3>
                <p className="text-xs text-slate-500">
                  Candidate: <strong>{targetApplication?.candidate_name}</strong>
                </p>
              </div>
              <button
                onClick={() => setProposeModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProposeInterview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Proposed Slot Option 1 (Date & Time)
                </label>
                <input
                  type="datetime-local"
                  required
                  value={slot1}
                  onChange={(e) => setSlot1(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Proposed Slot Option 2 (Date & Time)
                </label>
                <input
                  type="datetime-local"
                  value={slot2}
                  onChange={(e) => setSlot2(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Interview Mode
                </label>
                <select
                  value={interviewMode}
                  onChange={(e) => setInterviewMode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <option value="online">Online Video Conference</option>
                  <option value="in-person">In-Person at Office</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Meeting Link / Location
                </label>
                <input
                  type="text"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notes for Candidate
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Preparation advice or technical topics..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setProposeModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scheduling}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 disabled:opacity-50"
                >
                  {scheduling ? 'Sending Proposal...' : 'Send Interview Slots'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
