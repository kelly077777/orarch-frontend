// ============================================================
// ORARCH API Client
// All calls to the Spring Boot backend go through here
// ============================================================

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

function getToken() {
  if (typeof window !== 'undefined') return localStorage.getItem('orarch_token');
  return null;
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem('orarch_token');
    localStorage.removeItem('orarch_user');
    window.location.href = '/login';
    return;
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || 'Request failed');
  return data;
}

// ---- AUTH ----
export const auth = {
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  register: (body) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  me: () => request('/auth/me'),
};

// ---- PROJECTS ----
export const projects = {
  list: () => request('/projects'),
  get: (id) => request(`/projects/${id}`),
  create: (body) => request('/projects', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => request(`/projects/${id}`, { method: 'DELETE' }),
  members: (id) => request(`/projects/${id}/members`),
  addMember: (id, body) => request(`/projects/${id}/members`, { method: 'POST', body: JSON.stringify(body) }),
  removeMember: (id, userId) => request(`/projects/${id}/members/${userId}`, { method: 'DELETE' }),
};

// ---- DOCUMENTS ----
export const documents = {
  list: (projectId) => request(`/documents?projectId=${projectId}`),
  get: (id) => request(`/documents/${id}`),
  create: (body) => request('/documents', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/documents/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => request(`/documents/${id}`, { method: 'DELETE' }),
  versions: (id) => request(`/documents/${id}/versions`),
  addVersion: (id, body) => request(`/documents/${id}/versions`, { method: 'POST', body: JSON.stringify(body) }),

  // File upload (multipart)
  upload: async (projectId, file, meta) => {
    const token = getToken();
    const form = new FormData();
    form.append('file', file);
    form.append('projectId', projectId);
    form.append('title', meta.title || file.name);
    form.append('documentType', meta.documentType || 'DRAWING');
    form.append('discipline', meta.discipline || 'ARCHITECTURAL');

    const res = await fetch(`${BASE_URL}/documents/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data;
  },
};

// ---- APPROVALS ----
export const approvals = {
  list: (projectId) => request(`/approvals${projectId ? `?projectId=${projectId}` : ''}`),
  get: (id) => request(`/approvals/${id}`),
  create: (body) => request('/approvals', { method: 'POST', body: JSON.stringify(body) }),
  decide: (id, decision, comments) =>
    request(`/approvals/${id}/decide`, { method: 'POST', body: JSON.stringify({ decision, comments }) }),
  decisions: (id) => request(`/approvals/${id}/decisions`),
  templates: (organizationId) => request(`/approvals/templates?organizationId=${organizationId}`),
};

// ---- COMMENTS ----
export const comments = {
  list: (documentId) => request(`/comments?documentId=${documentId}`),
  create: (body) => request('/comments', { method: 'POST', body: JSON.stringify(body) }),
  resolve: (id) => request(`/comments/${id}/resolve`, { method: 'PATCH' }),
  delete: (id) => request(`/comments/${id}`, { method: 'DELETE' }),
};

// ---- NOTIFICATIONS ----
export const notifications = {
  list: () => request('/notifications'),
  unreadCount: () => request('/notifications/unread-count'),
  markRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () => request('/notifications/read-all', { method: 'PATCH' }),
};

// ---- USERS ----
export const users = {
  list: (organizationId) => request(`/users?organizationId=${organizationId}`),
  get: (id) => request(`/users/${id}`),
  update: (id, body) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
};

// ---- STORAGE ----
export const storage = {
  usage: (organizationId) => request(`/storage?organizationId=${organizationId}`),
};

// ---- AUDIT ----
export const audit = {
  list: (organizationId) => request(`/audit?organizationId=${organizationId}`),
};
