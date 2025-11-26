"use client";
import { usePathname } from "next/navigation";
import Header from './Header';
import Footer from './Footer';
/**
 * @interface ConditionalLayoutProps
 * @description 조건부 레이아웃 래퍼 안에 렌더링할 자식 요소를 담는 속성입니다.
 * @property {React.ReactNode} children 레이아웃 내부에 렌더링할 콘텐츠.
 */
interface ConditionalLayoutProps {
  children: React.ReactNode;
}
/**
 * @component ConditionalLayout
 * @description 공개 페이지에는 전역 헤더/푸터를 감싸고, 관리자 페이지는 순수 콘텐츠만 렌더링합니다.
 * @param {ConditionalLayoutProps} param0 렌더링할 자식 요소.
 * @returns {JSX.Element} 경로에 따라 레이아웃을 적용하는 래퍼 컴포넌트.
 */
export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');
  if (isAdminPage) {
    return <>{children}</>;
  }
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
