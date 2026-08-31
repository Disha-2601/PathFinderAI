import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authApi } from '../services/api';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: {
    email: string;
    password: string;
    full_name: string;
    role?: string;
    target_role?: string;
    experience_level?: string;
    bio?: string;
  }) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  loginDemoUser: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('pathfinder_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { showToast } = useToast();

  // Validate existing token and load user profile on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('pathfinder_token');
      if (storedToken) {
        try {
          const data = await authApi.me();
          setUser(data.user);
          setToken(storedToken);
        } catch (error) {
          console.warn('Session expired or invalid, logging out.');
          localStorage.removeItem('pathfinder_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const data = await authApi.login(email, password);
      localStorage.setItem('pathfinder_token', data.token);
      setToken(data.token);
      setUser(data.user);
      showToast('success', 'Welcome Back!', `Logged in as ${data.user.full_name}`);
      return true;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Invalid email or password.';
      showToast('error', 'Login Failed', message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    full_name: string;
    role?: string;
    target_role?: string;
    experience_level?: string;
    bio?: string;
  }): Promise<boolean> => {
    try {
      setIsLoading(true);
      const data = await authApi.register(userData);
      localStorage.setItem('pathfinder_token', data.token);
      setToken(data.token);
      setUser(data.user);
      showToast('success', 'Account Created!', `Welcome to PathFinder AI, ${data.user.full_name}`);
      return true;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed. Please check your details.';
      showToast('error', 'Registration Failed', message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('pathfinder_token');
    setToken(null);
    setUser(null);
    showToast('info', 'Logged Out', 'You have been successfully signed out.');
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const data = await authApi.me();
      setUser(data.user);
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
    }
  };

  const loginDemoUser = async (): Promise<boolean> => {
    const demoEmail = 'alex.rivera@pathfinder.ai';
    const demoPassword = 'password123';

    try {
      setIsLoading(true);
      try {
        const data = await authApi.login(demoEmail, demoPassword);
        localStorage.setItem('pathfinder_token', data.token);
        setToken(data.token);
        setUser(data.user);
        showToast('success', 'Welcome, Alex Rivera!', 'Authenticated demo account.');
        return true;
      } catch (loginErr: any) {
        // Fallback auto-registration attempt if the backend has not seeded the demo user yet.
        if (loginErr.response?.status === 401 || loginErr.response?.status === 404) {
          console.log('Demo user login failed - attempting auto-registration fallback...');
          try {
            const regData = await authApi.register({
              email: demoEmail,
              password: demoPassword,
              full_name: 'Alex Rivera',
              role: 'student',
              target_role: 'AI Solutions Architect',
              experience_level: 'intermediate',
              bio: 'Full-stack software engineer specializing in LLMs, high-scale RAG, and autonomous agent ecosystems.'
            });
            localStorage.setItem('pathfinder_token', regData.token);
            setToken(regData.token);
            setUser(regData.user);
            showToast('success', 'Demo Account Created & Signed In!', 'Logged in as Alex Rivera.');
            return true;
          } catch (regErr: any) {
            console.error('Fallback demo auto-registration failed:', regErr);
            throw loginErr;
          }
        } else {
          throw loginErr;
        }
      }
    } catch (err: any) {
      showToast('error', 'Demo Login Failed', err.response?.data?.message || 'Could not authenticate demo user.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        loginDemoUser,
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
