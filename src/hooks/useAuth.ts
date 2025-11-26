'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { AuthState } from '@/types';
/**
 * @description Custom hook for use auth.ts.
 * @returns {any} 처리 결과
 */
export const useAuth = () => {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: null,
    isLoading: true,
    user: null
  });
  useEffect(() => {
    /**
     * @description check Auth for use auth.ts.
     * @returns {any} 처리 결과
     */
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
  /**
   * @description logout for use auth.ts.
   * @returns {any} 처리 결과
   */
  const logout = async () => {
    try {
      await authApi.post('/admin/logout');
    } catch {
    } finally {
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
