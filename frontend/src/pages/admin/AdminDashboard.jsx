import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { StatusBadge, ScoreBadge } from '../../components/common/Badge';
import {
  Shield,
  Users,
  Briefcase,
  Layers,
  Award,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Lock,
  Unlock,
  Activity,
  FileCheck
} from 'lucide-react';

export function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [analyticsData, usersData, jobsData, logsData] = await Promise.all([
        api.admin.getAnalytics(),
        api.admin.getUsers(),
        api.admin.getJobs(),
        api.admin.getAuditLogs()
      ]);
      setAnalytics(analyticsData);
      setUsers(usersData);
      setJobs(jobsData);
      setAuditLogs(logsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleSuspend = async (userId, currentActive) => {
    try {
      await api.admin.toggleStatus(userId, !currentActive);
      setActionMsg(`User status updated.`);
      fetchData();
      setTimeout(() => setActionMsg(''), 3000);
    } catch (e) {
      alert(e.message || 'Error updating user status');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This cascade deletes their profiles and applications.')) return;
    try {
      await api.admin.deleteUser(userId);
      setActionMsg('User deleted successfully.');
      fetchData();
      setTimeout(() => setActionMsg(''), 3000);
    } catch (e) {
      alert(e.message || 'Error deleting user');
    }
  };

  const handleModerateJob = async (jobId, status) => {
    try {
      await api.admin.moderateJob(jobId, status);
      setActionMsg(`Job status updated to ${status}.`);
      fetchData();
      setTimeout(() => setActionMsg(''), 3000);
    } catch (e) {
      alert(e.message || 'Error moderating job');
    }
  };

  const overview = analytics?.overview || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white border border-slate-800/80 shadow-xs flex flex-wrap items-center justify-between gap-6">
        <div>
          <span className="px-3 py-1 bg-white/10 text-white/90 rounded-full text-xs font-semibold tracking-wide uppercase border border-white/10 inline-block mb-3">
            System Administration
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display">
            Platform Analytics & Governance
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">
            Monitor real-time candidate volumes, system ATS scores, moderate postings, and manage user authorizations.
          </p>
        </div>
      </div>

      {actionMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'overview' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Analytics & Metrics
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'users' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          User Management ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('jobs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'jobs' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Job Moderation ({jobs.length})
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'logs' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          System Audit Trail
        </button>
      </div>

      {/* Overview Analytics Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Total Users</span>
              <p className="text-2xl font-black text-slate-900 mt-2">{overview.total_users || 0}</p>
              <span className="text-[11px] text-slate-500">
                {overview.total_candidates} Candidates • {overview.total_recruiters} Recruiters
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Total Applications</span>
              <p className="text-2xl font-black text-brand-600 mt-2">{overview.total_applications || 0}</p>
              <span className="text-[11px] text-slate-500">
                {overview.shortlisted_applications} Shortlisted • {overview.hired_count} Hired
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Avg ATS Compatibility</span>
              <p className="text-2xl font-black text-emerald-600 mt-2">{overview.average_ats_score || 0}%</p>
              <span className="text-[11px] text-slate-500">Across all uploaded resumes</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Avg Skill Match</span>
              <p className="text-2xl font-black text-indigo-600 mt-2">{overview.average_skill_match || 0}%</p>
              <span className="text-[11px] text-slate-500">Semantic requirement match</span>
            </div>
          </div>

          {/* Recent Applications Activity */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-4">
              Recent Application Stream
            </h3>
            <div className="divide-y divide-slate-100">
              {analytics?.recent_applications?.map((app) => (
                <div key={app.id} className="py-3 flex flex-wrap items-center justify-between text-xs gap-3">
                  <div>
                    <span className="font-bold text-slate-900">{app.candidate_name}</span> applied for{' '}
                    <strong className="text-brand-700">{app.job_title}</strong> at {app.company_name}
                    <span className="text-slate-400 block text-[11px] mt-0.5">
                      {new Date(app.applied_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ScoreBadge score={app.ats_score} label="ATS" size="sm" />
                    <ScoreBadge score={app.skill_match_score} label="Skills" size="sm" />
                    <StatusBadge status={app.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Users Management Tab */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 px-3">User</th>
                <th className="pb-3 px-3">Role</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3">Details</th>
                <th className="pb-3 px-3 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-4 px-3">
                    <div className="font-bold text-slate-900">{u.full_name}</div>
                    <div className="text-xs text-slate-400">{u.email}</div>
                  </td>
                  <td className="py-4 px-3">
                    <span className="text-xs font-bold uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-4 px-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      u.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {u.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="py-4 px-3 text-xs text-slate-500">
                    {u.company_name || u.headline || 'Standard user'}
                  </td>
                  <td className="py-4 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggleSuspend(u.id, u.is_active)}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition flex items-center gap-1 ${
                          u.is_active
                            ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {u.is_active ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                        {u.is_active ? 'Suspend' : 'Activate'}
                      </button>

                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Jobs Moderation Tab */}
      {activeTab === 'jobs' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 px-3">Job Title & Company</th>
                <th className="pb-3 px-3">Recruiter</th>
                <th className="pb-3 px-3">Applicants</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jobs.map((j) => (
                <tr key={j.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-4 px-3">
                    <div className="font-bold text-slate-900">{j.title}</div>
                    <div className="text-xs text-brand-600">{j.company_name} • {j.location}</div>
                  </td>
                  <td className="py-4 px-3 text-xs text-slate-500">
                    {j.recruiter_name} ({j.recruiter_email})
                  </td>
                  <td className="py-4 px-3 font-bold text-slate-800">
                    {j.applicant_count || 0}
                  </td>
                  <td className="py-4 px-3">
                    <StatusBadge status={j.status} />
                  </td>
                  <td className="py-4 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {j.status === 'open' ? (
                        <button
                          onClick={() => handleModerateJob(j.id, 'closed')}
                          className="px-2.5 py-1 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition"
                        >
                          Close Posting
                        </button>
                      ) : (
                        <button
                          onClick={() => handleModerateJob(j.id, 'open')}
                          className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition"
                        >
                          Approve / Open
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* System Audit Logs Tab */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-4">
            Security & Governance Audit Trail
          </h3>
          <div className="divide-y divide-slate-100 text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <span className="font-bold text-brand-700">{log.action}</span> by{' '}
                  <span className="font-semibold text-slate-800">{log.actor_name || 'System'}</span>
                  <p className="text-slate-500 mt-0.5">
                    Target: {log.target_type} ({log.target_id})
                  </p>
                </div>
                <span className="text-[11px] text-slate-400 shrink-0">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
