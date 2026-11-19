import React from 'react';

export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`animate-pulse bg-slate-200/70 rounded-xl ${className}`}
      {...props}
    />
  );
}

export function JobCardSkeleton() {
  return (
    <div className="p-5 rounded-2xl border border-slate-200/80 bg-white space-y-3 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2 w-2/3">
          <div className="h-5 bg-slate-200 rounded-lg w-3/4" />
          <div className="h-3.5 bg-slate-100 rounded-md w-1/2" />
        </div>
        <div className="h-6 w-20 bg-slate-100 rounded-full" />
      </div>
      <div className="flex gap-2 pt-1">
        <div className="h-5 w-24 bg-slate-100 rounded-md" />
        <div className="h-5 w-20 bg-slate-100 rounded-md" />
        <div className="h-5 w-16 bg-slate-100 rounded-md" />
      </div>
      <div className="flex gap-1.5 pt-2">
        <div className="h-6 w-16 bg-brand-50 rounded-md" />
        <div className="h-6 w-16 bg-brand-50 rounded-md" />
        <div className="h-6 w-16 bg-brand-50 rounded-md" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 6, rows = 3 }) {
  return (
    <tbody className="divide-y divide-slate-100 animate-pulse">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx}>
          {Array.from({ length: cols }).map((_, cIdx) => (
            <td key={cIdx} className="py-4 px-2">
              <div
                className={`h-4 bg-slate-200/70 rounded-md ${
                  cIdx === 0 ? 'w-3/4' : cIdx === 1 ? 'w-1/2' : 'w-16'
                }`}
              />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm animate-pulse space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-3 bg-slate-200 rounded-md w-24" />
        <div className="w-8 h-8 rounded-xl bg-slate-100" />
      </div>
      <div className="h-7 bg-slate-200 rounded-lg w-16" />
      <div className="h-3 bg-slate-100 rounded-md w-32" />
    </div>
  );
}

