import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { Bell, Check, CheckCheck, Video, Calendar, Briefcase, ExternalLink } from 'lucide-react';

export function NotificationDropdown({ isOpen, onClose }) {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleNotificationClick = (n) => {
    markRead(n.id);
    onClose();

    if (n.type === 'interview_confirmed' || n.type === 'interview_proposed' || n.type === 'application_status' || n.type === 'application_submitted') {
      navigate('/candidate/dashboard');
    } else if (n.type === 'new_applicant') {
      navigate('/recruiter/dashboard');
    }
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150"
    >
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-brand-600" />
          <h3 className="font-semibold text-slate-900 text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-brand-100 text-brand-700 text-xs px-2 py-0.5 rounded-full font-medium">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs text-brand-600 hover:text-brand-800 font-medium flex items-center gap-1"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No notifications yet
          </div>
        ) : (
          notifications.map((n) => {
            const isInterview = n.type === 'interview_confirmed' || n.type === 'interview_proposed';
            const isApplication = n.type === 'application_status' || n.type === 'application_submitted';

            return (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`p-4 text-sm transition-colors cursor-pointer hover:bg-slate-50 flex items-start gap-3 ${
                  !n.is_read ? 'bg-indigo-50/30' : ''
                }`}
              >
                <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!n.is_read ? 'bg-brand-600' : 'bg-transparent'}`} />
                <div className="flex-1">
                  <p className={`text-slate-800 leading-snug ${!n.is_read ? 'font-medium' : ''}`}>
                    {n.message}
                  </p>

                  {/* Contextual Action Pill */}
                  {n.type === 'interview_confirmed' ? (
                    <div className="mt-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-[11px]">
                        <Video className="w-3 h-3 text-indigo-600" /> Join Meeting Room &rarr;
                      </span>
                    </div>
                  ) : n.type === 'interview_proposed' ? (
                    <div className="mt-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-50 border border-brand-200 text-brand-700 font-bold text-[11px]">
                        <Calendar className="w-3 h-3 text-brand-600" /> Select Time Slot &rarr;
                      </span>
                    </div>
                  ) : isApplication ? (
                    <div className="mt-1.5">
                      <span className="text-[11px] text-brand-600 font-medium inline-flex items-center gap-0.5">
                        View Progress &rarr;
                      </span>
                    </div>
                  ) : null}

                  <span className="text-[11px] text-slate-400 mt-1.5 block">
                    {new Date(n.created_at).toLocaleDateString()} at {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
