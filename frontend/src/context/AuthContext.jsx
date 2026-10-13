import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('proofpath_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('proofpath_token') || null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' or 'register'

  useEffect(() => {
    // Validate current token with backend on mount
    async function verifySession() {
      if (token) {
        try {
          const res = await api.getMe();
          if (res.user) {
            setUser(res.user);
            localStorage.setItem('proofpath_user', JSON.stringify(res.user));
          }
        } catch (err) {
          console.warn('Session verification failed, logging out:', err.message);
          logout();
        }
      }
      setLoading(false);
    }

    verifySession();

    // Listen to unauthorized event dispatched by API client
    const handleUnauthorized = () => {
      logout();
      setAuthModalMode('login');
      setAuthModalOpen(true);
    };

    window.addEventListener('proofpath:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('proofpath:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    if (res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('proofpath_token', res.token);
      localStorage.setItem('proofpath_user', JSON.stringify(res.user));
      setAuthModalOpen(false);
      return res.user;
    }
    throw new Error('Authentication response missing credentials');
  };

  const register = async (name, email, password) => {
    const res = await api.register({ name, email, password });
    if (res.token && res.user) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('proofpath_token', res.token);
      localStorage.setItem('proofpath_user', JSON.stringify(res.user));
      setAuthModalOpen(false);
      return res.user;
    }
    throw new Error('Registration response missing credentials');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('proofpath_token');
    localStorage.removeItem('proofpath_user');
  };

  const openAuthModal = (mode = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        loading,
        login,
        register,
        logout,
        authModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        setAuthModalMode
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
