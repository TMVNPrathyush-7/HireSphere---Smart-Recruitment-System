import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, ScoreBadge } from '../../components/common/Badge';
import { StatCardSkeleton } from '../../components/common/Skeleton';
import {
  Layers,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  FileText,
  MessageSquare,
  ArrowRight,
  ExternalLink,
  Check,
  Building,
  User,
  Briefcase
} from 'lucide-react';

function ApplicationTracker({ status, appliedAt, confirmedSlot }) {
  const s = (status || '').toLowerCase();
  const isRejected = s === 'rejected';
  const isAccepted = s === 'accepted' || s === 'hired';

  let currentStep = 0;
  if (isRejected || isAccepted) currentStep = 3;
  else if (s === 'interview_scheduled' || s === 'interviewed') currentStep = 2;
  else if (s === 'under_review' || s === 'shortlisted') currentStep = 1;
  else currentStep = 0;

  const steps = [
    {
      title: 'Applied',
      mobileTitle: 'Applied',
      subtitle: appliedAt ? new Date(appliedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Submitted'
    },
    {
      title: 'AI & Recruiter Screening',
      mobileTitle: 'Screening',
      subtitle: currentStep >= 1 ? 'Reviewed' : 'Under Review'
    },
    {
      title: 'Interview',
      mobileTitle: 'Interview',
      subtitle: confirmedSlot
        ? new Date(confirmedSlot).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        : currentStep >= 2
        ? 'Slots Proposed'
        : 'Technical Round'
    },
    {
      title: 'Hiring Decision',
      mobileTitle: 'Decision',
      subtitle: isRejected ? 'Not Selected' : isAccepted ? 'Offer Extended 🎉' : 'Final Step'
    }
  ];

  return (
    <div className="w-full pt-4 pb-1">
      <div className="relative flex items-center justify-between">
        {/* Progress Connector Track */}
        <div className="absolute top-3.5 left-8 right-8 h-1 bg-slate-100 -translate-y-1/2 z-0" />
        <div
          className={`absolute top-3.5 left-8 h-1 -translate-y-1/2 transition-all duration-700 z-0 ${
            isRejected ? 'bg-rose-400' : 'bg-brand-600'
          }`}
          style={{ width: `${Math.min(85, Math.max(0, (currentStep / 3) * 85))}%` }}
        />

        {steps.map((st, idx) => {
          const isDone = idx < currentStep || (idx === currentStep && isAccepted);
          const isCurrent = idx === currentStep && !isAccepted && !isRejected;
          const isFailed = idx === currentStep && isRejected;

          return (
            <div key={idx} className="relative z-10 flex flex-col items-center flex-1 text-center px-0.5 sm:px-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                  isFailed
                    ? 'bg-rose-500 text-white ring-4 ring-rose-100'
                    : isDone
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                    : isCurrent
                    ? 'bg-brand-600 text-white ring-4 ring-brand-100 animate-pulse'
                    : 'bg-white border-2 border-slate-200 text-slate-400'
                }`}
              >
                {isDone ? (
                  <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                ) : isFailed ? (
                  '✕'
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <span
                className={`text-[10px] sm:text-[11px] font-bold mt-2 truncate max-w-[80px] sm:max-w-[120px] ${
                  isFailed
                    ? 'text-rose-600'
                    : isCurrent
                    ? 'text-brand-700 font-extrabold'
                    : isDone
                    ? 'text-slate-800'
                    : 'text-slate-400'
                }`}
              >
                <span className="sm:hidden">{st.mobileTitle}</span>
                <span className="hidden sm:inline">{st.title}</span>
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-400 truncate max-w-[80px] sm:max-w-[120px] mt-0.5">
                {st.subtitle}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CandidateDashboard() {
  const { user, profile } = useAuth();
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmSuccess, setConfirmSuccess] = useState('');

  const fetchData = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const [appsData, intData] = await Promise.all([
        api.applications.getCandidateApplications(profile.id),
        api.interviews.getCandidateInterviews(profile.id)
      ]);
      setApplications(appsData || []);
      setInterviews(intData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [profile]);

  const handleConfirmSlot = async (interviewId, slot) => {
    try {
      await api.interviews.confirm(interviewId, { confirmed_slot: slot, status: 'confirmed' });
      setConfirmSuccess('Interview time slot confirmed!');
      fetchData();
    } catch (err) {
      alert(err.message || 'Error confirming slot');
    }
  };

  const atsScore =
    profile?.parsed_resume_json?.ats_compatibility_score ||
    profile?.parsed_resume_json?.ats_readiness ||
    88;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* 1. WELCOME & ACTION BAR */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 font-extrabold text-base shadow-2xs">
            <User className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-display">
                Welcome back, {user?.full_name?.split(' ')[0] || 'Candidate'}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hidden sm:inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Candidate Portal
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {profile?.headline || 'Manage your active job applications, recruiter interviews, and AI resume profile.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/jobs"
            className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200"
          >
            <Briefcase className="w-3.5 h-3.5 text-slate-600" />
            Browse Jobs
          </Link>
          <Link
            to="/candidate/resume-builder"
            className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200"
          >
            <FileText className="w-3.5 h-3.5 text-brand-600" />
            Edit AI Resume
          </Link>
          <Link
            to="/candidate/mock-interview"
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Practice Interview
          </Link>
        </div>
      </div>

      {/* 2. STATS ROW */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Applications
              </span>
              <Layers className="w-4 h-4 text-brand-600" />
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2 font-display tabular-nums">
              {applications.length}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Interviews
              </span>
              <Calendar className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2 font-display tabular-nums">
              {interviews.length}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Skills Identified
              </span>
              <Sparkles className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2 font-display tabular-nums">
              {profile?.skills ? profile.skills.length : 0}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                ATS Compatibility
              </span>
              <CheckCircle2 className="w-4 h-4 text-brand-600" />
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2 font-display tabular-nums">
              {atsScore}%
            </p>
          </div>
        </div>
      )}

      {/* Confirmation notification alert */}
      {confirmSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-2xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{confirmSuccess}</span>
          </div>
          <button onClick={() => setConfirmSuccess('')} className="text-xs font-bold text-emerald-700">Dismiss</button>
        </div>
      )}

      {/* 3. SCHEDULED RECRUITER INTERVIEWS (If Any) */}
      {interviews.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight font-display flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Scheduled Interviews & Appointments
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Confirm your proposed time slots and access live interview meeting rooms
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {interviews.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl border border-indigo-100 bg-indigo-50/20 flex flex-wrap items-center justify-between gap-4"
              >
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{item.job_title}</h3>
                  <p className="text-xs text-brand-700 font-semibold">{item.company_name}</p>
                  
                  {item.confirmed_slot ? (
                    <p className="text-xs text-slate-600 mt-1 flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      Confirmed for: {new Date(item.confirmed_slot).toLocaleString()}
                    </p>
                  ) : (
                    <div className="mt-2">
                      <span className="text-xs text-amber-700 font-semibold block mb-1">
                        Select a proposed time slot:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {item.proposed_slots.map((slot, sIdx) => (
                          <button
                            key={sIdx}
                            onClick={() => handleConfirmSlot(item.id, slot)}
                            className="px-2.5 py-1 bg-white hover:bg-brand-50 border border-brand-200 text-brand-700 rounded-lg text-xs font-medium transition shadow-2xs"
                          >
                            {new Date(slot).toLocaleString()}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {item.notes && (
                    <p className="text-xs text-slate-500 mt-1 italic">"{item.notes}"</p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <StatusBadge status={item.status} />
                  {item.meeting_link && (
                    <a
                      href={item.meeting_link}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition flex items-center gap-1 shadow-sm"
                    >
                      Join Meeting
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. APPLICATIONS PIPELINE CARDS (Hero Section) */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight font-display">
              My Job Applications
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time hiring pipeline updates, AI screening scores, and application tracking
            </p>
          </div>
          <Link
            to="/jobs"
            className="text-xs font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1 bg-brand-50 px-3 py-1.5 rounded-xl border border-brand-100"
          >
            Find more jobs <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl border border-slate-100 bg-white shadow-xs space-y-4 animate-pulse">
              <div className="flex justify-between">
                <div className="h-5 bg-slate-200 rounded-md w-1/3" />
                <div className="h-5 bg-slate-100 rounded-full w-24" />
              </div>
              <div className="h-8 bg-slate-50 rounded-xl" />
            </div>
          </div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl space-y-3">
            <p className="text-sm font-medium text-slate-500">You haven't submitted any job applications yet.</p>
            <p className="text-xs text-slate-400">Browse open positions matching your skills and apply with 1-click AI resume sync.</p>
            <div>
              <Link
                to="/jobs"
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition"
              >
                Browse open positions <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div
                key={app.id}
                className="p-5 sm:p-6 rounded-2xl border border-slate-200/80 bg-white shadow-xs hover:border-brand-200 hover:shadow-md transition-all space-y-4"
              >
                {/* Position & Badges Header */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-extrabold text-slate-900 text-base">{app.job_title}</h3>
                      <StatusBadge status={app.status} />
                    </div>
                    <div className="text-xs text-brand-700 font-semibold mt-1 flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-brand-600" />
                        {app.company_name}
                      </span>
                      <span>•</span>
                      <span className="text-slate-400">
                        Applied {new Date(app.applied_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <ScoreBadge score={app.ats_score} label="ATS Compatibility" size="sm" />
                    <ScoreBadge score={app.skill_match_score} label="Skill Match" size="sm" />
                    <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-100">
                      Composite: {app.composite_score || Math.round((app.ats_score * 0.4) + (app.skill_match_score * 0.6))}%
                    </span>
                  </div>
                </div>

                {/* 4-Stage Visual Application Progress Tracker */}
                <ApplicationTracker
                  status={app.status}
                  appliedAt={app.applied_at}
                  confirmedSlot={app.confirmed_slot}
                />

                {/* Live Meeting Link Banner */}
                {app.meeting_link && app.status === 'interview_scheduled' && (
                  <div className="bg-indigo-50/70 border border-indigo-200/70 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-indigo-900 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                      Live Interview Confirmed: {app.confirmed_slot ? new Date(app.confirmed_slot).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Time confirmed'}
                    </span>
                    <a
                      href={app.meeting_link}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center gap-1 shadow-xs transition"
                    >
                      Join Meeting Room <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}