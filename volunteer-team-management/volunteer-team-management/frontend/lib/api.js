const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload, auth: false }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload, auth: false }),
  me: () => request('/auth/me'),

  getTeams: () => request('/teams'),
  getTeam: (id) => request(`/teams/${id}`),
  createTeam: (payload) => request('/teams', { method: 'POST', body: payload }),
  addTeamMember: (teamId, payload) => request(`/teams/${teamId}/members`, { method: 'POST', body: payload }),

  getTasks: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/tasks${qs ? `?${qs}` : ''}`);
  },
  createTask: (payload) => request('/tasks', { method: 'POST', body: payload }),
  updateTaskStatus: (id, status) => request(`/tasks/${id}/status`, { method: 'PATCH', body: { status } }),

  getMeetings: (teamId) => request(`/meetings${teamId ? `?teamId=${teamId}` : ''}`),
  getMeeting: (id) => request(`/meetings/${id}`),
  createMeeting: (payload) => request('/meetings', { method: 'POST', body: payload }),
  addMeetingNote: (id, content) => request(`/meetings/${id}/notes`, { method: 'POST', body: { content } }),

  getAnnouncements: (teamId) => request(`/announcements${teamId ? `?teamId=${teamId}` : ''}`),
  getAnnouncement: (id) => request(`/announcements/${id}`),
  createAnnouncement: (payload) => request('/announcements', { method: 'POST', body: payload }),
  replyToAnnouncement: (id, content, parentReplyId) =>
    request(`/announcements/${id}/replies`, { method: 'POST', body: { content, parentReplyId } }),
};

export function saveSession(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

export function getSession() {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  return token && user ? { token, user: JSON.parse(user) } : null;
}

export function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}
