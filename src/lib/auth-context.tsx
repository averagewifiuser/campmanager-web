// src/lib/auth-context.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi, tokenManager, handleApiError } from './api';
import type { User, LoginRequest, RegisterRequest } from './types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Check if user is logged in on app start
  useEffect(() => {
    const initAuth = async () => {
      const token = tokenManager.getToken();
      if (!token) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        const user = await authApi.getMe();
        setState({
          user,
          isLoading: false,
          isAuthenticated: true,
        });
      } catch (error) {
        console.error('Failed to get user:', error);
        tokenManager.clearTokens();
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    };

    initAuth();
  }, []);

  const login = async (data: LoginRequest) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const response = await authApi.login(data);
      
      // Store tokens
      tokenManager.setToken(response.access_token);
      tokenManager.setRefreshToken(response.refresh_token);
      
      setState({
        user: response.user,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw new Error(handleApiError(error));
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      // @ts-ignore
      const user = await authApi.register(data);
      
      // After registration, automatically log them in
      await login({ email: data.email, password: data.password });
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw new Error(handleApiError(error));
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      tokenManager.clearTokens();
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  };

  const refreshUser = async () => {
    try {
      const user = await authApi.getMe();
      setState(prev => ({ ...prev, user }));
    } catch (error) {
      console.error('Failed to refresh user:', error);
      await logout();
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};