import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Navbar } from './components/common/Navbar';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';

// Candidate Pages
import { JobBrowse } from './pages/candidate/JobBrowse';
import { CandidateDashboard } from './pages/candidate/CandidateDashboard';
import { ResumeBuilder } from './pages/candidate/ResumeBuilder';
import { MockInterview } from './pages/candidate/MockInterview';

// Recruiter Pages
import { RecruiterDashboard } from './pages/recruiter/RecruiterDashboard';
import { JobApplicants } from './pages/recruiter/JobApplicants';
import { RecruiterInterviews } from './pages/recruiter/RecruiterInterviews';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';

// Role-based Route Guard
function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">
        Loading session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Home Route Dispatcher
function HomeDispatcher() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">
        Loading platform...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/jobs" replace />;
  }

  if (user.role === 'recruiter') {
    return <Navigate to="/recruiter/dashboard" replace />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/candidate/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Home Dispatcher */}
                <Route path="/" element={<HomeDispatcher />} />

                {/* Auth */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Public & Candidate Job Search */}
                <Route path="/jobs" element={<JobBrowse />} />

                {/* Candidate Protected Routes */}
                <Route
                  path="/candidate/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['candidate', 'admin']}>
                      <CandidateDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/candidate/resume-builder"
                  element={
                    <ProtectedRoute allowedRoles={['candidate', 'admin']}>
                      <ResumeBuilder />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/candidate/mock-interview"
                  element={
                    <ProtectedRoute allowedRoles={['candidate', 'admin']}>
                      <MockInterview />
                    </ProtectedRoute>
                  }
                />

                {/* Recruiter Protected Routes */}
                <Route
                  path="/recruiter/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['recruiter', 'admin']}>
                      <RecruiterDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/recruiter/jobs/:jobId/applicants"
                  element={
                    <ProtectedRoute allowedRoles={['recruiter', 'admin']}>
                      <JobApplicants />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/recruiter/interviews"
                  element={
                    <ProtectedRoute allowedRoles={['recruiter', 'admin']}>
                      <RecruiterInterviews />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Protected Routes */}
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
