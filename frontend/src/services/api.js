const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    // If token invalid, clear local auth
    // (don't clear if already at login)
    if (!window.location.pathname.includes('/login')) {
      // optional auto redirect
    }
  }

  let data;
  try {
    data = await response.json();
  } catch (err) {
    data = { error: 'Invalid JSON response from server' };
  }

  if (!response.ok) {
    const errorMsg = data.error || data.detail || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  auth: {
    login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    getMe: () => request('/auth/me')
  },
  users: {
    getCandidate: (id) => request(`/users/candidates/${id}`),
    updateCandidate: (id, body) => request(`/users/candidates/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    getRecruiter: (id) => request(`/users/recruiters/${id}`),
    updateRecruiter: (id, body) => request(`/users/recruiters/${id}`, { method: 'PUT', body: JSON.stringify(body) })
  },
  jobs: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/jobs${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/jobs/${id}`),
    create: (body) => request('/jobs', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/jobs/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id) => request(`/jobs/${id}`, { method: 'DELETE' }),
    getRecruiterJobs: (recruiterId) => request(`/jobs/recruiter/${recruiterId}`)
  },
  applications: {
    apply: (jobId) => request('/applications', { method: 'POST', body: JSON.stringify({ job_id: jobId }) }),
    getJobApplications: (jobId) => request(`/applications/job/${jobId}`),
    getCandidateApplications: (candidateId) => request(`/applications/candidate/${candidateId}`),
    updateStatus: (id, status) => request(`/applications/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) })
  },
  resumes: {
    upload: (formData) => request('/resumes/upload', { method: 'POST', body: formData }),
    build: (body) => request('/resumes/build', { method: 'POST', body: JSON.stringify(body) }),
    getParsed: (candidateId) => request(`/resumes/${candidateId}/parsed`),
    getSuggestions: (candidateId, jobId = '') => request(`/resumes/${candidateId}/suggestions${jobId ? `?jobId=${jobId}` : ''}`),
    getSkillGap: (candidateId, jobId) => request(`/resumes/${candidateId}/skill-gap?jobId=${jobId}`)
  },
  interviews: {
    propose: (body) => request('/interviews', { method: 'POST', body: JSON.stringify(body) }),
    confirm: (id, body) => request(`/interviews/${id}/confirm`, { method: 'PUT', body: JSON.stringify(body) }),
    getCandidateInterviews: (candidateId) => request(`/interviews/candidate/${candidateId}`),
    getRecruiterInterviews: (recruiterId) => request(`/interviews/recruiter/${recruiterId}`)
  },
  admin: {
    getUsers: () => request('/admin/users'),
    toggleStatus: (id, is_active) => request(`/admin/users/${id}/suspend`, { method: 'PUT', body: JSON.stringify({ is_active }) }),
    deleteUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),
    getJobs: () => request('/admin/jobs'),
    moderateJob: (id, status) => request(`/admin/jobs/${id}/moderate`, { method: 'PUT', body: JSON.stringify({ status }) }),
    getAnalytics: () => request('/admin/analytics/summary'),
    getAuditLogs: () => request('/admin/audit-logs')
  },
  notifications: {
    getAll: () => request('/notifications'),
    markRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
    markAllRead: () => request('/notifications/read-all', { method: 'PUT' })
  },
  ai: {
    mockInterviewQuestions: (role, skills) => request('/ai/mock-interview-questions', { method: 'POST', body: JSON.stringify({ role, skills }) }),
    evaluateInterviewAnswer: (data) => request('/ai/evaluate-interview-answer', { method: 'POST', body: JSON.stringify(data) }),
    interactiveInterviewTurn: (data) => request('/ai/interactive-interview-turn', { method: 'POST', body: JSON.stringify(data) }),
    skillMatch: (candidate_skills, required_skills) => request('/ai/skill-match', { method: 'POST', body: JSON.stringify({ candidate_skills, required_skills }) }),
    atsScore: (candidate, job) => request('/ai/ats-score', { method: 'POST', body: JSON.stringify({ candidate, job }) })
  }
};
