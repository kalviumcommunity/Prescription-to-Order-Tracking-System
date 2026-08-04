import { createContext, useContext, useState, useCallback } from 'react';
import { api, setToken, getToken } from '../api';

const AuthContext = createContext(null);

const USER_KEY = 'rx_user';
const ROLE_KEY = 'rx_role';

function loadStoredUser() {
  const token = getToken();
  const role = localStorage.getItem(ROLE_KEY);
  const rawUser = localStorage.getItem(USER_KEY);
  if (!token || !role) return null;
  return { token, role, user: rawUser ? JSON.parse(rawUser) : null };
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(loadStoredUser);

  const persist = useCallback((data) => {
    setToken(data.token);
    localStorage.setItem(ROLE_KEY, data.role);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user || null));
    setAuth({ token: data.token, role: data.role, user: data.user || null });
  }, []);

  const login = useCallback(async (email, password, role) => {
    const data = await api.post('/auth/login', { email, password, role });
    persist(data);
    return data;
  }, [persist]);

  const register = useCallback(async (role, payload) => {
    const path = role === 'pharmacy' ? '/auth/register/pharmacy' : '/auth/register/doctor';
    const data = await api.post(path, payload);
    persist(data);
    return data;
  }, [persist]);

  const logout = useCallback(() => {
    setToken(null);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(USER_KEY);
    setAuth(null);
  }, []);

  return (
    <AuthContext.Provider value={{ auth, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
