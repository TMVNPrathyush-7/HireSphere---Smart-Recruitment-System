import React from 'react';

export function StatusBadge({ status }) {
  const styles = {
    applied: 'bg-blue-50 text-blue-700 border-blue-200',
    under_review: 'bg-amber-50 text-amber-700 border-amber-200',
    shortlisted: 'bg-purple-50 text-purple-700 border-purple-200',
    interview_scheduled: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200',
    hired: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    open: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    closed: 'bg-slate-100 text-slate-700 border-slate-200',
    draft: 'bg-amber-50 text-amber-700 border-amber-200'
  };

  const labels = {
    applied: 'Applied',
    under_review: 'Under Review',
    shortlisted: 'Shortlisted',
    interview_scheduled: 'Interview Scheduled',
    rejected: 'Not Selected',
    hired: 'Offer Accepted / Hired',
    open: 'Open Position',
    closed: 'Closed',
    draft: 'Draft'
  };

  const style = styles[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  const label = labels[status] || status;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {label}
    </span>
  );
}

export function ScoreBadge({ score, label = "Score", size = "md" }) {
  let color = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (score < 60) {
    color = 'text-rose-700 bg-rose-50 border-rose-200';
  } else if (score < 80) {
    color = 'text-amber-700 bg-amber-50 border-amber-200';
  }

  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg font-semibold border ${color} ${padding}`}>
      <span className="text-xs font-normal opacity-80">{label}:</span>
      <span>{score}%</span>
    </span>
  );
}
