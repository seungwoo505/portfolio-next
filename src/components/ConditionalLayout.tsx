"use client";

import { usePathname } from "next/navigation";
import Header from './Header';
import Footer from './Footer';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  
  // admin 경로인지 확인
  const isAdminPage = pathname.startsWith('/admin');
  
  if (isAdminPage) {
    // admin 페이지에서는 헤더와 푸터를 렌더링하지 않음
    return <>{children}</>;
  }
  
  // 일반 페이지에서는 헤더와 푸터를 렌더링
  return (
    <>
      <Header />
      <main>
        {children}
      </main>
      <Footer />
    </>
  );
}
