import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { decodeJwt, isTokenExpired } from '../utils/jwt';

const AuthContext = createContext(null);

function clearStorage() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

function loadSession() {
  try {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!token || !user || isTokenExpired(token)) {
      clearStorage();
      return null;
    }
    return { token, user };
  } catch {
    clearStorage();
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(loadSession);

  // data = { token, userId, email, name, role } straight from the backend
  const login = useCallback((data) => {
    const user = { userId: data.userId, name: data.name, email: data.email, role: data.role };
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(user));
    setSession({ token: data.token, user });
  }, []);

  const logout = useCallback(() => {
    clearStorage();
    setSession(null);
  }, []);

  // Used after the profile is edited so the sidebar and greeting show the new name
  const updateUser = useCallback((changes) => {
    setSession((current) => {
      if (!current) return current;
      const user = { ...current.user, ...changes };
      localStorage.setItem('user', JSON.stringify(user));
      return { ...current, user };
    });
  }, []);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      expiresAt: session ? (decodeJwt(session.token)?.exp ?? 0) * 1000 : null,
      login,
      logout,
      updateUser,
    }),
    [session, login, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
