"use client";
import Link from "next/link";
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAdmin } from '@/contexts/AdminContext';
import { Button } from '@/components/ui/button';
import { 
  LogOut,
  ArrowLeft,
  Menu,
  Moon,
  Sun
} from 'lucide-react';
interface AdminHeaderProps {
  sidebarOpen?: boolean;
  onMenuToggle?: () => void;
}
/**
 * @description Admin Header for admin header.tsx.
  * @param {*} { onMenuToggle } 입력값
 * @returns {JSX.Element} 처리 결과
 */
export default function AdminHeader({ onMenuToggle, sidebarOpen = false }: AdminHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAdmin();
  const [isDarkMode, setIsDarkMode] = useState<boolean | null>(null);
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
    const root = document.documentElement;
    const currentTheme = root.getAttribute('data-theme');
    setIsDarkMode(currentTheme === 'dark');
  }, []);
  /**
   * @description toggle Theme for admin header.tsx.
   * @returns {any} 처리 결과
   */
  const toggleTheme = () => {
    const root = document.documentElement;
    const newDarkMode = !(isDarkMode ?? root.classList.contains('dark'));
    setIsDarkMode(newDarkMode);
    const theme = newDarkMode ? 'dark' : 'light';
    root.classList.toggle('dark', newDarkMode);
    root.style.colorScheme = theme;
    root.setAttribute('data-theme', theme);
    document.cookie = `theme=${theme}; path=/; max-age=31536000`;
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // 저장소를 사용할 수 없는 환경에서도 현재 화면의 테마는 전환한다.
    }
  };
  /**
   * @description Handles logout for admin header.tsx.
   * @returns {any} 처리 결과
   */
  const handleLogout = async () => {
    await logout();
    router.push('/admin-login');
  };
  /**
   * @description Gets page info for admin header.tsx.
   * @returns {any} 처리 결과
   */
  const getPageInfo = () => {
    if (pathname === '/admin') {
      return {
        title: '관리자 대시보드',
        showBackButton: false,
        backLink: null,
        backText: ''
      };
    } else if (pathname.startsWith('/admin/blog')) {
      if (pathname === '/admin/blog/new') {
        return {
          title: '새 블로그 포스트 작성',
          showBackButton: true,
          backLink: '/admin/blog',
          backText: '블로그 관리로 돌아가기'
        };
      } else if (pathname.startsWith('/admin/blog/edit/')) {
        return {
          title: '블로그 포스트 수정',
          showBackButton: true,
          backLink: '/admin/blog',
          backText: '블로그 관리로 돌아가기'
        };
      } else if (pathname === '/admin/blog') {
        return {
          title: '블로그 관리',
          showBackButton: true,
          backLink: '/admin',
          backText: '대시보드로 돌아가기'
        };
      }
    } else if (pathname.startsWith('/admin/projects')) {
      if (pathname === '/admin/projects/new') {
        return {
          title: '새 프로젝트 작성',
          showBackButton: true,
          backLink: '/admin/projects',
          backText: '프로젝트 목록으로 돌아가기'
        };
      } else if (pathname.startsWith('/admin/projects/edit/')) {
        return {
          title: '프로젝트 수정',
          showBackButton: true,
          backLink: '/admin/projects',
          backText: '프로젝트 관리로 돌아가기'
        };
      } else if (pathname === '/admin/projects') {
        return {
          title: '프로젝트 관리',
          showBackButton: true,
          backLink: '/admin',
          backText: '대시보드로 돌아가기'
        };
      }
    } else if (pathname.startsWith('/admin/users')) {
      if (pathname === '/admin/users') {
        return {
          title: '사용자 관리',
          showBackButton: true,
          backLink: '/admin',
          backText: '대시보드로 돌아가기'
        };
      } else if (pathname.startsWith('/admin/users/edit/')) {
        return {
          title: '사용자 편집',
          showBackButton: true,
          backLink: '/admin/users',
          backText: '사용자 관리로 돌아가기'
        };
      }
    } else if (pathname.startsWith('/admin/contacts')) {
      return {
        title: '연락처 관리',
        showBackButton: true,
        backLink: '/admin',
        backText: '대시보드로 돌아가기'
      };
    } else if (pathname.startsWith('/admin/tags')) {
      return {
        title: '태그 관리',
        showBackButton: true,
        backLink: '/admin',
        backText: '대시보드로 돌아가기'
      };
    } else if (pathname.startsWith('/admin/skills')) {
      return {
        title: '기술 스택 관리',
        showBackButton: true,
        backLink: '/admin',
        backText: '대시보드로 돌아가기'
      };
    }
    return {
      title: '관리자 페이지',
      showBackButton: true,
      backLink: '/admin',
      backText: '대시보드로 돌아가기'
    };
  };
  const pageInfo = getPageInfo();
  const renderThemeIcon = () =>
    (isDarkMode ?? false) ? (
      <Sun className="w-5 h-5" />
    ) : (
      <Moon className="w-5 h-5" />
    );

  /**
   * @description Handles back navigation for admin header.tsx.
   * @returns {any} 처리 결과
   */
  const handleBackNavigation = () => {
    if (pageInfo.backLink) {
      router.push(pageInfo.backLink);
    }
  };
  return (
    <header className="w-full border-b border-zinc-200 bg-white/95 dark:border-zinc-800 dark:bg-zinc-950/95">
      <nav className="flex min-h-16 items-center justify-between gap-3 px-4 sm:px-6" aria-label="관리자 도구">
        <div className="flex min-w-0 items-center gap-3 sm:gap-5">
          <Button plain onClick={onMenuToggle} className="lg:hidden" aria-label="관리자 메뉴 열기" aria-expanded={sidebarOpen} aria-controls="admin-navigation"><Menu className="h-5 w-5" /></Button>
          <Link href="/" prefetch={false} className="shrink-0 text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">승우<span className="text-teal-700 dark:text-teal-400">.dev</span></Link>
          <span className="hidden h-5 w-px bg-zinc-200 sm:block dark:bg-zinc-800" aria-hidden="true" />
          <h1 className="hidden truncate text-sm font-medium text-zinc-600 sm:block dark:text-zinc-400">{pageInfo.title}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          <span className="hidden text-sm text-zinc-500 xl:block dark:text-zinc-400">{user?.username}님</span>
          {isClient && <Button plain onClick={toggleTheme} aria-label={(isDarkMode ?? false) ? '라이트 모드로 전환' : '다크 모드로 전환'}>{renderThemeIcon()}</Button>}
          <Button plain onClick={handleLogout} aria-label="로그아웃"><LogOut className="h-4 w-4" /><span className="hidden sm:inline">로그아웃</span></Button>
        </div>
      </nav>
      {pageInfo.showBackButton && <div className="flex items-center gap-2 border-t border-zinc-100 px-4 py-2 sm:px-6 dark:border-zinc-800/60"><button onClick={handleBackNavigation} className="inline-flex min-h-8 items-center gap-2 rounded-md px-2 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-teal-700 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-teal-400"><ArrowLeft className="h-3.5 w-3.5" /><span>{pageInfo.backText}</span></button><span className="truncate text-xs text-zinc-500 sm:hidden dark:text-zinc-400">{pageInfo.title}</span></div>}
    </header>
  );
}
