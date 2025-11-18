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

  // 인증 상태 확인
  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const token = authApi.getToken();
      
      if (!token) {
        // 토큰이 없으면 인증되지 않은 상태로 설정
        setUser(null);
        setPermissions([]);
        setIsLoading(false);
        return;
      }

      // 백엔드에서 자동으로 토큰 재발급 처리
      const response = await authApi.get('/admin/me');
      if (response.success && response.data) {
        const authData = response.data as { user: AdminUser; permissions: string[] };
        setUser(authData.user);
        setPermissions(authData.permissions);
      } else {
        // 토큰이 유효하지 않음
        authApi.clearToken();
        setUser(null);
        setPermissions([]);
        // 에러 메시지가 있으면 로그에 기록
        if (response.message) {
          // 인증 실패
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

  // 로그인
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
        
        // 토큰 유효성 검사 시작 (5분마다)
        authApi.startTokenValidation();
        
        return true;
      } else {
        // 서버에서 success: false를 반환한 경우
        const errorMessage = response.message || '로그인에 실패했습니다.';
        throw new Error(errorMessage);
      }
    } catch (error) {
      // API 호출 실패 또는 서버 에러
      const errorMessage = error instanceof Error ? error.message : '로그인에 실패했습니다.';
      throw new Error(errorMessage);
    }
  };

  // 로그아웃
  const logout = async () => {
    try {
      // 서버에 로그아웃 요청 (활동 로그 기록용)
      await authApi.post('/admin/logout');
    } catch {
      // 로그아웃 API 실패는 무시 (클라이언트에서 토큰 삭제)
    } finally {
      // 클라이언트에서 토큰 삭제
      authApi.clearToken();
      setUser(null);
      setPermissions([]);
    }
  };

  // 초기 인증 상태 확인
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

// 권한 확인 훅
export function usePermission(permission: string) {
  const { permissions } = useAdmin();
  return permissions.includes(permission);
}

// 역할 확인 훅
export function useRole(role: string) {
  const { user } = useAdmin();
  return user?.role === role;
}
