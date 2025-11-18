'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { AuthState } from '@/types';

export const useAuth = () => {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: null,
    isLoading: true,
    user: null
  });

  useEffect(() => {
    const checkAuth = async () => {
          try {
      const response = await authApi.get('/admin/me');
      if (response.success && response.data) {
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          user: response.data as { id: string; username: string; email: string; role: string }
        });
      } else {
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          user: null
        });
      }
      } catch (error: unknown) {
        // 401 Unauthorized 에러인 경우 토큰 정리
        if ((error as { response?: { status: number }; message?: string })?.response?.status === 401 || (error as { message?: string })?.message?.includes('401')) {
          authApi.clearToken();
          router.push('/admin-login');
          return;
        }
        
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          user: null
        });
      }
    };

    checkAuth();
  }, [router]);

  const logout = async () => {
    try {
      // 서버에 로그아웃 요청 (활동 로그 기록용)
      await authApi.post('/admin/logout');
    } catch {
      // 로그아웃 API 실패 (토큰은 이미 정리됨)
    } finally {
      // 클라이언트에서 토큰 삭제
      authApi.clearToken();
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null
      });
      router.push('/admin-login');
    }
  };

  return {
    ...authState,
    logout
  };
};
