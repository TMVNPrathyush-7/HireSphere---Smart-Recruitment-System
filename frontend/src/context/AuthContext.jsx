import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const DEMO_USERS = {
  admin: { email: 'admin@recruitment.com', password: 'Password123!', label: 'Admin (System)', role: 'admin' },
  recruiter1: { email: 'recruiter@google.com', password: 'Password123!', label: 'Recruiter (Google Cloud)', role: 'recruiter' },
  recruiter2: { email: 'hiring@microsoft.com', password: 'Password123!', label: 'Recruiter (Microsoft)', role: 'recruiter' },
  candidate1: { email: 'alex.chen@gmail.com', password: 'Password123!', label: 'Candidate (Alex - Senior Full Stack)', role: 'candidate' },
  candidate2: { email: 'sarah.miller@gmail.com', password: 'Password123!', label: 'Candidate (Sarah - AI/ML Engineer)', role: 'candidate' },
  candidate3: { email: 'rohit.sharma@gmail.com', password: 'Password123!', label: 'Candidate (Rohit - Frontend)', role: 'candidate' }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await api.auth.getMe();
        setUser(data.user);
        setProfile(data.profile);
      } catch (err) {
        console.warn('Session expired or invalid:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const data = await api.auth.login({ email, password });
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    setProfile(data.profile);
    return data;
  };

  const register = async (payload) => {
    const data = await api.auth.register(payload);
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    // Fetch full profile
    const me = await api.auth.getMe();
    setProfile(me.profile);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (!token) return;
    try {
      const data = await api.auth.getMe();
      setUser(data.user);
      setProfile(data.profile);
    } catch (e) {
      console.error('Error refreshing profile:', e);
    }
  };

  const quickLogin = async (key) => {
    const demo = DEMO_USERS[key];
    if (!demo) return;
    return await login(demo.email, demo.password);
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      token,
      loading,
      login,
      register,
      logout,
      refreshProfile,
      quickLogin,
      isAuthenticated: !!user,
      isCandidate: user?.role === 'candidate',
      isRecruiter: user?.role === 'recruiter',
      isAdmin: user?.role === 'admin'
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
