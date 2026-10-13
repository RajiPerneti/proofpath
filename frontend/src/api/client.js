// ProofPath API Client with JWT Authentication & Resume Support

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = localStorage.getItem('proofpath_token');

  const headers = {
    ...options.headers
  };

  // Only set application/json if body is not FormData
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Attach JWT Bearer token if user is authenticated
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (response.status === 401) {
      // Clear expired / invalid token and notify application
      if (token) {
        localStorage.removeItem('proofpath_token');
        localStorage.removeItem('proofpath_user');
        window.dispatchEvent(new CustomEvent('proofpath:unauthorized'));
      }
    }

    if (!response.ok) {
      throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Authentication
  login: (credentials) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  getMe: () => request('/auth/me'),

  // Templates
  getTemplates: () => request('/templates'),

  // Assessments
  getAssessments: () => request('/assessments'),
  createAssessment: (data) =>
    request('/assessments', { method: 'POST', body: JSON.stringify(data) }),
  getAssessment: (id) => request(`/assessments/${id}`),
  deleteAssessment: (id) => request(`/assessments/${id}`, { method: 'DELETE' }),

  // Interview & Evidence Submission
  submitAnswer: (id, payload) =>
    request(`/assessments/${id}/submit`, { method: 'POST', body: JSON.stringify(payload) }),
  getEvents: (id) => request(`/assessments/${id}/events`),
  getDecisions: (id) => request(`/assessments/${id}/decisions`),

  // Competency Explorer
  getCompetencies: (id) => request(`/assessments/${id}/competencies`),

  // Code Challenges
  runCode: (id, payload) =>
    request(`/assessments/${id}/run-code`, { method: 'POST', body: JSON.stringify(payload) }),
  submitCode: (id, payload) =>
    request(`/assessments/${id}/submit-code`, { method: 'POST', body: JSON.stringify(payload) }),

  // Resume Parsing
  parseResume: (formData) =>
    request('/resumes/parse', { method: 'POST', body: formData }),

  // Final Report
  getReport: (id) => request(`/assessments/${id}/report`),

  // Health
  checkHealth: () => request('/health')
};
