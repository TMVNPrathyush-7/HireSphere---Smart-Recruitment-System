import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, DEMO_USERS } from '../../context/AuthContext';
import { Sparkles, ArrowRight, Lock, Mail, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';

export function Login() {
  const { login, quickLogin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (key) => {
    setError('');
    setLoading(true);
    try {
      await quickLogin(key);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 py-12">
      <div className="max-w-md w-full">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-500 text-white mb-3 shadow-lg shadow-brand-500/25">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Welcome back to HireSphere
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Sign in to access AI-powered ATS screening and hiring tools
          </p>
        </div>

        {/* Demo Fast Login Banner */}
        <div className="bg-gradient-to-br from-indigo-50/80 to-brand-50/80 border border-brand-200/80 rounded-2xl p-4 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-xs font-bold text-brand-800 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-brand-600" />
            1-Click Demo Evaluation Accounts
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('admin')}
              className="px-2.5 py-2 bg-white hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-medium border border-slate-200/80 shadow-xs text-left transition flex items-center justify-between"
            >
              <span>Admin Dashboard</span>
              <ArrowRight className="w-3 h-3 text-brand-600" />
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('recruiter1')}
              className="px-2.5 py-2 bg-white hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-medium border border-slate-200/80 shadow-xs text-left transition flex items-center justify-between"
            >
              <span>Recruiter (Google)</span>
              <ArrowRight className="w-3 h-3 text-brand-600" />
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('candidate1')}
              className="px-2.5 py-2 bg-white hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-medium border border-slate-200/80 shadow-xs text-left transition flex items-center justify-between"
            >
              <span>Alex (Full Stack)</span>
              <ArrowRight className="w-3 h-3 text-brand-600" />
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('candidate2')}
              className="px-2.5 py-2 bg-white hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-medium border border-slate-200/80 shadow-xs text-left transition flex items-center justify-between"
            >
              <span>Sarah (AI Engineer)</span>
              <ArrowRight className="w-3 h-3 text-brand-600" />
            </button>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 transition"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Authenticating...' : 'Sign in to Account'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Don't have an account yet?{' '}
            <Link to="/register" className="text-brand-600 hover:text-brand-700 font-bold">
              Create an account
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
