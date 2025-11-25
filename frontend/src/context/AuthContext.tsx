/**
 * Authentication Context for AI Teacher
 * Manages user authentication state across the application
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '../types';
import { authApi } from '../api/services';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (sevisPassId: string, password: string, name?: string, gradeLevel?: number, school?: string, email?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        console.log('AuthContext: Loading user from storage:', storedUser ? 'Found' : 'Not found');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          console.log('AuthContext: User data loaded:', userData.sevis_pass_id);
          setUser(userData);
          
          // Optionally refresh user data from server
          if (userData.sevis_pass_id) {
            try {
              const response = await authApi.getProfile(userData.sevis_pass_id);
              if (response.status === 'success' && response.data) {
                console.log('AuthContext: User data refreshed from server');
                setUser(response.data);
                localStorage.setItem('user', JSON.stringify(response.data));
              }
            } catch (error) {
              console.error('Failed to refresh user data:', error);
              // Keep stored user data if refresh fails
            }
          }
        } else {
          console.log('AuthContext: No user in storage');
        }
      } catch (error) {
        console.error('Failed to load user from storage:', error);
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
        console.log('AuthContext: Loading complete');
      }
    };

    loadUser();
  }, []);

  const login = async (
    sevisPassId: string,
    password: string,
    name?: string,
    gradeLevel?: number,
    school?: string,
    email?: string
  ) => {
    try {
      setLoading(true);
      const response = await authApi.login({
        sevis_pass_id: sevisPassId,
        password,
        name,
        grade_level: gradeLevel,
        school,
        email,
      });

      if (response.status === 'success' && response.data) {
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const refreshUser = async () => {
    if (!user?.sevis_pass_id) return;

    try {
      const response = await authApi.getProfile(user.sevis_pass_id);
      if (response.status === 'success' && response.data) {
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

