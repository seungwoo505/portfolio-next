"use client";

import { useState } from 'react';
import AdminHeader from './components/AdminHeader';
import AdminSidebar from './components/AdminSidebar';
import AuthGuard from '@/components/AuthGuard';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleMenuToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 safari-admin-layout">
        <div className="fixed top-0 left-0 right-0 z-50">
          <AdminHeader onMenuToggle={handleMenuToggle} />
        </div>
        <div className="flex pt-20 lg:pt-16">
          <AdminSidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />
          <main className="flex-1 p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 lg:ml-0 safari-admin-main">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
