import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, DEMO_USERS } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { NotificationDropdown } from './NotificationDropdown';
import {
  Briefcase,
  Layers,
  FileText,
  MessageSquare,
  Users,
  Shield,
  Bell,
  LogOut,
  ChevronDown,
  Sparkles,
  Calendar,
  Menu,
  X,
  Check
} from 'lucide-react';

// Smart name formatter for long or multi-word names
function formatDisplayName(fullName) {
  if (!fullName) return 'User';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 2) return fullName;
  // If 3+ names (e.g. Medha Venkata Naga Prathyush Tumuluri):
  // Gracefully format as First + Last Name: "Medha Tumuluri"
  return `${parts[0]} ${parts[parts.length - 1]}`;
}

// Smart initials extractor (First initial + Last initial)
function getInitials(fullName) {
  if (!fullName) return 'U';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function Navbar() {
  const { user, logout, quickLogin, isCandidate, isRecruiter, isAdmin } = useAuth();
  const { unreadCount } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleQuickSwitch = async (key) => {
    setShowDemoMenu(false);
    try {
      await quickLogin(key);
      window.location.href = '/';
    } catch (e) {
      console.error('Quick switch failed:', e);
      navigate('/');
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 no-print">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* 1. Left: Brand & Logo */}
          <div className="flex items-center shrink-0">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-700 to-indigo-600 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight font-display text-slate-900">
                  Hire<span className="text-brand-600 font-black">Sphere</span>
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200/60">
                  Enterprise
                </span>
              </div>
            </Link>
          </div>

          {/* 2. Center: Centralized & Enlarged Navigation Links */}
          {user && (
            <div className="hidden md:flex items-center justify-center gap-1.5 flex-1 mx-4 max-w-3xl">
              {isCandidate && (
                <>
                  <Link
                    to="/jobs"
                    className={`px-3.5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                      isActive('/jobs')
                        ? 'bg-slate-100 text-slate-950 border border-slate-200/90 font-bold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                    }`}
                  >
                    <Briefcase className="w-4 h-4 text-slate-500" />
                    Browse Jobs
                  </Link>
                  <Link
                    to="/candidate/dashboard"
                    className={`px-3.5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                      isActive('/candidate/dashboard')
                        ? 'bg-slate-100 text-slate-950 border border-slate-200/90 font-bold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                    }`}
                  >
                    <Layers className="w-4 h-4 text-slate-500" />
                    My Applications
                  </Link>
                  <Link
                    to="/candidate/resume-builder"
                    className={`px-3.5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                      isActive('/candidate/resume-builder')
                        ? 'bg-slate-100 text-slate-950 border border-slate-200/90 font-bold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                    }`}
                  >
                    <FileText className="w-4 h-4 text-slate-500" />
                    AI Resume Builder
                  </Link>
                  <Link
                    to="/candidate/mock-interview"
                    className={`px-3.5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                      isActive('/candidate/mock-interview')
                        ? 'bg-slate-100 text-slate-950 border border-slate-200/90 font-bold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 text-slate-500" />
                    Mock Interview
                  </Link>
                </>
              )}

              {isRecruiter && (
                <>
                  <Link
                    to="/recruiter/dashboard"
                    className={`px-3.5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                      isActive('/recruiter/dashboard')
                        ? 'bg-slate-100 text-slate-950 border border-slate-200/90 font-bold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                    }`}
                  >
                    <Layers className="w-4 h-4 text-slate-500" />
                    Pipeline & Jobs
                  </Link>
                  <Link
                    to="/recruiter/interviews"
                    className={`px-3.5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                      isActive('/recruiter/interviews')
                        ? 'bg-slate-100 text-slate-950 border border-slate-200/90 font-bold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                    }`}
                  >
                    <Calendar className="w-4 h-4 text-slate-500" />
                    Interviews
                  </Link>
                </>
              )}

              {isAdmin && (
                <Link
                  to="/admin/dashboard"
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                    isActive('/admin/dashboard')
                      ? 'bg-slate-100 text-slate-950 border border-slate-200/90 font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                  }`}
                >
                  <Shield className="w-4 h-4 text-slate-500" />
                  Platform Analytics & Users
                </Link>
              )}
            </div>
          )}

          {/* 3. Right: Persona Switcher, Notifications & Profile */}
          <div className="flex items-center gap-2.5 shrink-0">
            
            {/* Minimalist Persona Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowDemoMenu(!showDemoMenu)}
                className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs whitespace-nowrap"
                title="Switch demo persona (Candidate, Recruiter, Admin)"
              >
                <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                <span className="hidden sm:inline text-slate-400 font-normal">Persona:</span>
                <span className="font-bold text-slate-800 capitalize">
                  {user?.role || 'Demo'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showDemoMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200/80 p-1.5 z-50">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Instant Demo Persona
                  </div>
                  {Object.entries(DEMO_USERS).map(([key, demo]) => {
                    const isCurrent = user?.email === demo.email;
                    return (
                      <button
                        key={key}
                        onClick={() => handleQuickSwitch(key)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                          isCurrent ? 'bg-brand-50 text-brand-700 font-bold' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isCurrent && <Check className="w-3.5 h-3.5 text-brand-600" />}
                          <span>{demo.label}</span>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {demo.role}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {user ? (
              <>
                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg relative transition"
                    title="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-brand-600 rounded-full ring-2 ring-white"></span>
                    )}
                  </button>
                  <NotificationDropdown
                    isOpen={showNotifications}
                    onClose={() => setShowNotifications(false)}
                  />
                </div>

                {/* Profile Pill with Smart Name Formatting */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1 pl-2.5 rounded-lg hover:bg-slate-50 transition border border-slate-200/80 shadow-2xs"
                  >
                    <div className="text-left hidden md:block">
                      <div
                        className="text-xs font-bold text-slate-800 leading-tight max-w-[125px] truncate"
                        title={user.full_name}
                      >
                        {formatDisplayName(user.full_name)}
                      </div>
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        {user.role}
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-md bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
                      {getInitials(user.full_name)}
                    </div>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-slate-200/80 p-1.5 z-50">
                      <div className="px-3 py-2.5 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-900 leading-snug">{user.full_name}</p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{user.email}</p>
                        <span className="inline-block mt-1.5 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider bg-brand-50 text-brand-700 border border-brand-200/60 rounded-md">
                          {user.role} Account
                        </span>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 mt-1 rounded-lg text-xs text-rose-600 font-semibold hover:bg-rose-50 transition flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Log out
                      </button>
                    </div>
                  )}
                </div>

                {/* Mobile Menu Toggle Button */}
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                  aria-label="Toggle navigation menu"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5 text-slate-800" /> : <Menu className="w-5 h-5" />}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-2xs transition"
                >
                  Register
                </Link>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white/98 backdrop-blur-lg px-4 pt-3 pb-5 space-y-1 shadow-lg">
          {user && (
            <div className="px-3 py-2 mb-2 bg-slate-50 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">{user.full_name}</p>
                <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{user.email}</p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-100 text-brand-700">
                {user.role}
              </span>
            </div>
          )}

          {isCandidate && (
            <>
              <Link
                to="/candidate/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2.5 ${
                  isActive('/candidate/dashboard') ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Layers className="w-4 h-4 text-brand-600" />
                <span>My Applications</span>
              </Link>
              <Link
                to="/jobs"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2.5 ${
                  isActive('/jobs') ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Briefcase className="w-4 h-4 text-brand-600" />
                <span>Browse Jobs</span>
              </Link>
              <Link
                to="/candidate/resume-builder"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2.5 ${
                  isActive('/candidate/resume-builder') ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <FileText className="w-4 h-4 text-brand-600" />
                <span>AI Resume Builder</span>
              </Link>
              <Link
                to="/candidate/mock-interview"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2.5 ${
                  isActive('/candidate/mock-interview') ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-brand-600" />
                <span>Mock Interview</span>
              </Link>
            </>
          )}

          {isRecruiter && (
            <>
              <Link
                to="/recruiter/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2.5 ${
                  isActive('/recruiter/dashboard') ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Users className="w-4 h-4 text-brand-600" />
                <span>Candidate Pipeline</span>
              </Link>
              <Link
                to="/recruiter/interviews"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2.5 ${
                  isActive('/recruiter/interviews') ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Calendar className="w-4 h-4 text-brand-600" />
                <span>Interview Schedules</span>
              </Link>
            </>
          )}

          {isAdmin && (
            <Link
              to="/admin/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2.5 ${
                isActive('/admin/dashboard') ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Shield className="w-4 h-4 text-brand-600" />
              <span>Platform Analytics & Users</span>
            </Link>
          )}

          {user && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition flex items-center gap-2.5 border-t border-slate-100 mt-2 pt-3"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </button>
          )}
        </div>
      )}
    </nav>
  );
}