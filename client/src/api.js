// Thin fetch wrapper. Attaches the JWT and normalizes errors.

// Empty in local dev -> requests stay relative ("/api/...") and go through the
// Vite proxy. Set to the deployed backend's origin in production (e.g. a
// Render URL) so the built SPA talks to it directly, with no proxy involved.
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

const TOKEN_KEY = 'rx_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

// Thrown for any non-2xx response. Carries the server's { error, code }.
export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_BASE}/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    // fetch() itself throws on DNS/offline/CORS failures — the server was never reached.
    throw new ApiError(0, 'network_error', 'Could not reach the server');
  }

  let data = null;
  let text;
  try {
    text = await res.text();
  } catch {
    throw new ApiError(0, 'network_error', 'Connection interrupted while reading the response');
  }
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      // Server responded but the body isn't the JSON shape the client expects.
      throw new ApiError(res.status, 'unexpected_data', 'The server returned a response the app could not understand');
    }
  }

  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`;
    const code = (data && data.code) || 'error';
    throw new ApiError(res.status, code, message);
  }
  return data;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  patch: (path, body) => request('PATCH', path, body),
};
