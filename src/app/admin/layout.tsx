"use client";
import { useState } from 'react';
import AdminHeader from './components/AdminHeader';
import AdminSidebar from './components/AdminSidebar';
import AuthGuard from '@/components/AuthGuard';
import { AdminProvider } from '@/contexts/AdminContext';
/**
 * @component AdminLayout
 * @description 관리자 영역의 공통 헤더, 사이드바, 인증 가드를 적용하는 레이아웃.
 * @param {{ children: React.ReactNode }} param0 렌더링할 자식 요소.
 * @returns {JSX.Element} 관리자 전용 레이아웃 컨테이너.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  /**
   * @function handleMenuToggle
   * @description 모바일 사이드바의 열림 상태를 토글한다.
   * @returns {void}
   */
  const handleMenuToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };
  /**
   * @function handleSidebarClose
   * @description 사이드바를 강제로 닫는다.
   * @returns {void}
   */
  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };
  return (
    <AdminProvider>
      <AuthGuard>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 safari-admin-layout">
          <div className="fixed top-0 left-0 right-0 z-50">
            <AdminHeader onMenuToggle={handleMenuToggle} />
          </div>
          <div className="flex pt-20 lg:pt-16">
            <AdminSidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />
            <main className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 lg:ml-0 safari-admin-main">
              {children}
            </main>
          </div>
        </div>
      </AuthGuard>
    </AdminProvider>
  );
}
