import axios from 'axios';

// Everything goes through the API gateway
export const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: `${GATEWAY_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// Attach the JWT to every request (Fixed with .trim() to avoid newline issues)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token.trim()}`;
  }
  return config;
});

// Token missing or expired: clear the session and go to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    if (status === 401 && !url.startsWith('/auth/')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login?expired=1');
      }
    }
    return Promise.reject(error);
  }
);

// Backend errors look like { status, message, path, fieldErrors }
export function getErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.request && !err.response) {
    return 'Cannot reach the server. Make sure the API gateway (port 8080) is running.';
  }
  return fallback;
}

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
};

// Some features (submissions, skill profiles) need newer backend endpoints.
// If the backend does not have them yet it answers 404; we return an empty result
// flagged `unsupported: true` so pages can hide the feature instead of breaking.
async function optional(call, emptyValue) {
  try {
    return await call();
  } catch (err) {
    if (err.response?.status === 404) return { data: emptyValue, unsupported: true };
    throw err;
  }
}

export const profileApi = {
  me: () => optional(() => api.get('/auth/me'), null),
  update: (data) => api.put('/auth/me', data),
  changePassword: (data) => api.put('/auth/me/password', data),
  developers: () => optional(() => api.get('/auth/developers'), []),
};

export const projectApi = {
  open: () => api.get('/projects'),
  mine: () => api.get('/projects/my-projects'),
  get: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  remove: (id) => api.delete(`/projects/${id}`),
  accept: (id) => api.post(`/projects/${id}/accept`),
  complete: (id) => api.post(`/projects/${id}/complete`),
};

export const submissionApi = {
  mine: () => optional(() => api.get('/projects/submissions/my'), []),
  forProject: (projectId) => api.get(`/projects/${projectId}/submissions`),
  create: (projectId, data) => api.post(`/projects/${projectId}/submissions`, data),
  review: (submissionId, data) => api.put(`/projects/submissions/${submissionId}/review`, data),
};

export const escrowApi = {
  mine: () => api.get('/escrows/my'),
  byProject: (projectId) => api.get(`/escrows/project/${projectId}`),
  create: (projectId) => api.post('/escrows', { projectId }),
  release: (projectId) => api.put(`/escrows/project/${projectId}/release`),
  refund: (projectId) => api.put(`/escrows/project/${projectId}/refund`),
};

export default api;