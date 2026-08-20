import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const SESSION_KEY = 'intellora_session';

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session on page load
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      try { setCurrentUser(JSON.parse(stored)); } catch {}
    }
    setLoading(false);
  }, []);

  // ── Register ─────────────────────────────────────────────────────────
  const register = async (name, email, password) => {
    if (!name || !email || !password) {
      return { success: false, error: 'All fields are required.' };
    }
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      const session = { id: data._id, name: data.name, email: data.email, role: data.role, token: data.token };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      setCurrentUser(session);
      return { success: true, role: data.role };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'Registration failed. Please try again.',
      };
    }
  };

  // ── Login ─────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const session = { id: data._id, name: data.name, email: data.email, role: data.role, token: data.token };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      setCurrentUser(session);
      return { success: true, role: data.role };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'Invalid email or password.',
      };
    }
  };

  // ── Logout ────────────────────────────────────────────────────────────
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout API call failed:', err);
    }
    localStorage.removeItem(SESSION_KEY);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
