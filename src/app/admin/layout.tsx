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
        <div className="admin-shell min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
          <div className="sticky top-0 z-40">
            <AdminHeader onMenuToggle={handleMenuToggle} sidebarOpen={sidebarOpen} />
          </div>
          <div className="mx-auto flex max-w-[1600px]">
            <AdminSidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />
            <main className="min-w-0 flex-1 p-4 sm:p-6 lg:py-8 lg:pr-8">
              <div className="min-h-[calc(100dvh-10rem)] rounded-xl border border-zinc-200 bg-white p-4 sm:p-6 lg:p-8 dark:border-zinc-800 dark:bg-zinc-900">{children}</div>
            </main>
          </div>
        </div>
      </AuthGuard>
    </AdminProvider>
  );
}
