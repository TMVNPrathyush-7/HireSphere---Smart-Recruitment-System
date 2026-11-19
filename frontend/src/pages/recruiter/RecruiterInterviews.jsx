import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/Badge';
import { Calendar, Clock, ExternalLink, User, Mail } from 'lucide-react';

export function RecruiterInterviews() {
  const { profile } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!profile) return;
      try {
        const data = await api.interviews.getRecruiterInterviews(profile.id);
        setInterviews(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [profile]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Calendar className="w-6 h-6 text-brand-600" />
          Scheduled Candidate Interviews
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review upcoming candidate interview slots, confirmation statuses, and meeting links
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading interviews...</div>
        ) : interviews.length === 0 ? (
          <div className="p-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl">
            No interviews currently scheduled. Open a job pipeline to propose interview slots to top ranked candidates.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {interviews.map((item) => (
              <div key={item.id} className="py-5 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-base">{item.candidate_name}</span>
                    <span className="text-xs text-slate-400">({item.candidate_email})</span>
                  </div>
                  <p className="text-xs text-brand-700 font-semibold">{item.job_title}</p>
                  
                  {item.confirmed_slot ? (
                    <div className="text-xs text-emerald-800 font-medium flex items-center gap-1.5 mt-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      Confirmed Time: <strong>{new Date(item.confirmed_slot).toLocaleString()}</strong>
                    </div>
                  ) : (
                    <div className="text-xs text-amber-700 font-medium mt-1">
                      Proposed Slots Pending Confirmation: {item.proposed_slots.map(s => new Date(s).toLocaleDateString()).join(', ')}
                    </div>
                  )}

                  {item.notes && (
                    <p className="text-xs text-slate-500 italic mt-0.5">Note: "{item.notes}"</p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <StatusBadge status={item.status} />
                  {item.meeting_link && (
                    <a
                      href={item.meeting_link}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition flex items-center gap-1.5 shadow-sm"
                    >
                      Join Meeting
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
