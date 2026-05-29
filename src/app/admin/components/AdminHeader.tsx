"use client";
import Link from "next/link";
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAdmin } from '@/contexts/AdminContext';
import { 
  LogOut,
  ArrowLeft,
  Menu
} from 'lucide-react';
interface AdminHeaderProps {
  onMenuToggle?: () => void;
}
/**
 * @description Admin Header for admin header.tsx.
  * @param {*} { onMenuToggle } 입력값
 * @returns {JSX.Element} 처리 결과
 */
export default function AdminHeader({ onMenuToggle }: AdminHeaderProps) {
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
    if (newDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      root.style.setProperty('--background', '#0a0a0a');
      root.style.setProperty('--foreground', '#ededed');
      root.style.colorScheme = 'dark';
      root.setAttribute('data-theme', 'dark');
      root.style.backgroundColor = '#0a0a0a';
      root.style.color = '#ededed';
      document.cookie = 'theme=dark; path=/; max-age=31536000';
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      root.style.setProperty('--background', '#ffffff');
      root.style.setProperty('--foreground', '#171717');
      root.style.colorScheme = 'light';
      root.setAttribute('data-theme', 'light');
      root.style.backgroundColor = '#ffffff';
      root.style.color = '#171717';
      document.cookie = 'theme=light; path=/; max-age=31536000';
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
    <div 
      className="sticky top-0 z-50 w-full backdrop-blur-md border-b border-slate-200 bg-white/95 safari-header-light dark:border-slate-700 dark:bg-slate-900/95 dark:safari-header-dark"
    >
      <header className="w-full">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:hidden">
            <div className="flex justify-between items-center min-h-[4rem] py-2">
              <div className="flex items-center space-x-3">
                <button
                  onClick={onMenuToggle}
                  className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  aria-label="메뉴 열기"
                >
                  <Menu className="w-6 h-6" />
                </button>
                <Link href="/" prefetch={false}>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    승우.dev
                  </h1>
                </Link>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-600 dark:text-slate-400 hidden sm:block">
                  {user?.username}님
                </span>
                {isClient && (
                  <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-500 transition duration-150 hover:scale-110 active:scale-95"
                    title="다크모드 토글"
                  >
                    {(isDarkMode ?? false) ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    )}
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition duration-150 hover:scale-105 active:scale-95"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center space-x-2">
                {pageInfo.showBackButton && (
                  <button
                    onClick={handleBackNavigation}
                    className="p-1 rounded text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition duration-150 hover:scale-110 active:scale-90"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <h2 className="text-base font-semibold text-slate-700 dark:text-slate-300">
                  {pageInfo.title}
                </h2>
              </div>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="flex justify-between items-center h-16">
              <div
                className="flex origin-left items-center space-x-4 transition-transform duration-150 hover:scale-[1.02]"
              >
                <Link href="/">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    승우.dev
                  </h1>
                </Link>
                <span className="text-slate-400">|</span>
                <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                  {pageInfo.title}
                </h2>
                {pageInfo.showBackButton && (
                  <button
                    onClick={handleBackNavigation}
                    className="flex items-center space-x-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition duration-150 hover:-translate-y-0.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>{pageInfo.backText}</span>
                  </button>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  안녕하세요, <span className="font-medium text-slate-900 dark:text-white">{user?.username}</span>님
                </span>
                {isClient && (
                  <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-500 transition duration-150 hover:scale-110 active:scale-95"
                    title="다크모드 토글"
                  >
                    {(isDarkMode ?? false) ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    )}
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition duration-150 hover:-translate-y-0.5"
                >
                  <LogOut className="w-4 h-4" />
                  <span>로그아웃</span>
                </button>
              </div>
            </div>
          </div>
        </nav>
      </header>
    </div>
  );
}
