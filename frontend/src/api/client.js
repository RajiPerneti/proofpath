// ProofPath API Client

const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

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
  // Templates
  getTemplates: () => request('/templates'),

  // Assessments
  getAssessments: () => request('/assessments'),
  createAssessment: (data) => request('/assessments', { method: 'POST', body: JSON.stringify(data) }),
  getAssessment: (id) => request(`/assessments/${id}`),
  deleteAssessment: (id) => request(`/assessments/${id}`, { method: 'DELETE' }),

  // Interview & Evidence Submission
  submitAnswer: (id, payload) => request(`/assessments/${id}/submit`, { method: 'POST', body: JSON.stringify(payload) }),
  getEvents: (id) => request(`/assessments/${id}/events`),
  getDecisions: (id) => request(`/assessments/${id}/decisions`),

  // Competency Explorer
  getCompetencies: (id) => request(`/assessments/${id}/competencies`),

  // Code Challenges
  runCode: (id, payload) => request(`/assessments/${id}/run-code`, { method: 'POST', body: JSON.stringify(payload) }),
  submitCode: (id, payload) => request(`/assessments/${id}/submit-code`, { method: 'POST', body: JSON.stringify(payload) }),

  // Final Report
  getReport: (id) => request(`/assessments/${id}/report`),

  // Health
  checkHealth: () => request('/health')
};
