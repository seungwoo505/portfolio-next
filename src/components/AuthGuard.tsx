'use client';

import Link from "next/link";

import { ReactNode } from 'react';

import { useAuth } from '@/hooks/useAuth';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();

  // 로딩 중일 때
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">인증 상태를 확인하는 중...</p>
        </div>
      </div>
    );
  }

  // 인증 실패 시
  if (isAuthenticated === false) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            접근 권한이 없습니다
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            이 페이지에 접근하려면 로그인이 필요합니다.
          </p>
          <Link 
            href="/admin-login" 
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            로그인하기
          </Link>
        </div>
      </div>
    );
  }

  // 인증 성공 시
  return <>{children}</>;
}
