"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { adminApi, authApi } from '@/lib/api';
import { AdminUser } from '@/types';
interface AdminContextType {
  user: AdminUser | null;
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}
const AdminContext = createContext<AdminContextType | undefined>(undefined);
export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isAuthenticated = !!user;
  /**
   * @description check Auth for admin context.tsx.
   * @returns {any} 처리 결과
   */
  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const token = authApi.getToken();
      if (!token) {
        setUser(null);
        setPermissions([]);
        setIsLoading(false);
        return;
      }
      const response = await authApi.get('/admin/me');
      if (response.success && response.data) {
        const authData = response.data as { user: AdminUser; permissions: string[] };
        setUser(authData.user);
        setPermissions(authData.permissions);
      } else {
        authApi.clearToken();
        setUser(null);
        setPermissions([]);
        if (response.message) {
        }
      }
          } catch {
      authApi.clearToken();
      setUser(null);
      setPermissions([]);
    } finally {
      setIsLoading(false);
    }
  };
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await adminApi.login(username, password);
      if (response.success && response.data) {
        const { user, token, refreshToken, permissions } = response.data;
        authApi.setToken(token);
        if (refreshToken) {
          authApi.setRefreshToken(refreshToken);
        }
        setUser(user);
        setPermissions(permissions);
        authApi.startTokenValidation();
        return true;
      } else {
        const errorMessage = response.message || '로그인에 실패했습니다.';
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '로그인에 실패했습니다.';
      throw new Error(errorMessage);
    }
  };
  /**
   * @description logout for admin context.tsx.
   * @returns {any} 처리 결과
   */
  const logout = async () => {
    try {
      await authApi.post('/admin/logout');
    } catch {
    } finally {
      authApi.clearToken();
      setUser(null);
      setPermissions([]);
    }
  };
  useEffect(() => {
    checkAuth();
  }, []);
  const value = {
    user,
    permissions,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuth,
  };
  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}
export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
export function usePermission(permission: string) {
  const { permissions } = useAdmin();
  return permissions.includes(permission);
}
export function useRole(role: string) {
  const { user } = useAdmin();
  return user?.role === role;
}
