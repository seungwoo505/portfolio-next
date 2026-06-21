'use client';
import Link from "next/link";
import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/contexts/AdminContext';
/**
 * @interface AuthGuardProps
 * @description 인증 상태에 따라 보호된 콘텐츠를 렌더링하기 위한 설정입니다.
 * @property {ReactNode} children 인증된 사용자에게만 보여줄 콘텐츠.
 * @property {ReactNode} [fallback] 권한이 없을 때 표시할 선택적 대체 UI.
 */
interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}
/**
 * @component AuthGuard
 * @description 사용자가 인증되지 않았다면 접근을 제한하고 필요 시 대체 UI를 렌더링합니다.
 * @param {AuthGuardProps} param0 자식 및 대체 노드를 포함한 가드 설정.
 * @returns {JSX.Element} 인증 상태에 따라 보호된 콘텐츠, 대체 UI, 로딩 화면을 반환합니다.
 */
export default function AuthGuard({ children, fallback }: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAdmin();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !fallback) {
      router.replace('/admin-login');
    }
  }, [fallback, isAuthenticated, isLoading, router]);

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
  return <>{children}</>;
}
