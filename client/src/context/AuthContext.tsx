import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import api from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchDemoRole: (role: UserRole, specificEmail?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('ev_auth_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('ev_auth_token');
      if (storedToken) {
        try {
          const res: any = await api.get('/auth/me');
          if (res.success && res.data) {
            setUser(res.data);
          } else {
            setUser(null);
            setToken(null);
            localStorage.removeItem('ev_auth_token');
          }
        } catch {
          setUser(null);
          setToken(null);
          localStorage.removeItem('ev_auth_token');
        }
      } else {
        // Auto-login default Senior Analyst for instant review
        try {
          await switchDemoRole('ANALYST');
        } catch {
          // Ignore
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res: any = await api.post('/auth/login', { email, password });
      if (res.success && res.data) {
        const { token: newToken, user: newUser } = res.data;
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('ev_auth_token', newToken);
        localStorage.setItem('ev_auth_user', JSON.stringify(newUser));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('ev_auth_token');
      localStorage.removeItem('ev_auth_user');
    }
  };

  const switchDemoRole = async (targetRole: UserRole, specificEmail?: string) => {
    setIsLoading(true);
    let email = 'analyst@evmarket.internal';
    let password = 'Analyst@2026!';

    if (targetRole === 'ADMIN') {
      email = specificEmail || 'admindravya@ev';
      password = 'Admin@2026!';
    } else if (targetRole === 'VIEWER') {
      email = 'viewer@evmarket.internal';
      password = 'Viewer@2026!';
    }

    try {
      const res: any = await api.post('/auth/login', { email, password });
      if (res.success && res.data) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('ev_auth_token', res.data.token);
        localStorage.setItem('ev_auth_user', JSON.stringify(res.data.user));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const role: UserRole = user?.role || 'VIEWER';
  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isAuthenticated,
        isLoading,
        login,
        logout,
        switchDemoRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
