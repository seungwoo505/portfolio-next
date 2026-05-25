"use client";
import Link from "next/link";
import { useState, useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "홈" },
  { href: "/about", label: "소개" },
  { href: "/blog", label: "블로그" },
  { href: "/projects", label: "프로젝트" },
  { href: "/contact", label: "연락처" },
];

/**
 * @component Header
 * @description 네비게이션, 테마 토글, 모바일 메뉴를 포함한 전역 헤더를 렌더링합니다.
 * @returns {JSX.Element} 주요 네비게이션을 담은 고정형 헤더 요소를 반환합니다.
 */
export default function Header() {
  // 초기 상태를 null로 설정하여 서버와 클라이언트가 같은 HTML 렌더링 (hydration mismatch 방지)
  // useLayoutEffect 이후에 올바른 아이콘 표시
  const [isDarkMode, setIsDarkMode] = useState<boolean | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // useLayoutEffect를 사용하여 DOM이 페인트되기 전에 올바른 아이콘 표시
  useLayoutEffect(() => {
    const root = document.documentElement;
    const currentTheme = root.getAttribute('data-theme');
    setIsDarkMode(currentTheme === 'dark');
  }, []);

  /**
   * @function toggleTheme
   * @description 다크/라이트 테마를 전환하고 사용자의 선호를 저장합니다.
   * @returns {void}
   */
  const toggleTheme = () => {
    const root = document.documentElement;
    const currentDarkMode = isDarkMode ?? (root.getAttribute('data-theme') === 'dark');
    const newDarkMode = !currentDarkMode;
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
   * @function closeMobileMenu
   * @description 모바일 네비게이션 드로어를 강제로 닫습니다.
   * @returns {void}
   */
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const isActive = (href: string) => (
    href === "/" ? pathname === "/" : pathname.startsWith(href)
  );

  const renderThemeIcon = () => {
    if (isDarkMode === null) {
      // 초기 렌더링 시 공간을 유지하기 위한 빈 박스 (서버와 클라이언트가 같은 HTML 렌더링)
      return <div className="w-5 h-5" />;
    }

    if (isDarkMode) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );
    }

    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    );
  };

  return (
    <div className="sticky top-0 z-50 w-full backdrop-blur-md border-b border-slate-200 bg-white/95 safari-header-light dark:border-slate-700 dark:bg-slate-900/95 dark:safari-header-dark">
      <header className="w-full">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4 transition-transform duration-200 hover:-translate-y-1 hover:scale-[1.02]">
              <Link href="/" prefetch={false}>
                <h1
                  className="text-xl font-bold"
                  style={{
                    background: 'linear-gradient(to right, #2563eb, #9333ea)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    color: 'transparent',
                  }}
                >
                  승우.dev
                </h1>
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              {NAV_ITEMS.map((item) => (
                <div key={item.href} className="transition-transform duration-200 hover:-translate-y-1 hover:scale-[1.02]">
                  <Link
                    href={item.href}
                    prefetch={false}
                    className={`transition-colors ${
                      isActive(item.href)
                        ? "text-blue-600 dark:text-blue-400 font-semibold"
                        : "text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
                    }`}
                  >
                    {item.label}
                  </Link>
                </div>
              ))}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition duration-200 hover:scale-105 active:scale-95"
                title="다크모드 토글"
                suppressHydrationWarning
              >
                {renderThemeIcon()}
              </button>
            </div>

            <div className="md:hidden flex items-center space-x-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition duration-200 hover:scale-105 active:scale-95"
                title="다크모드 토글"
                suppressHydrationWarning
              >
                {renderThemeIcon()}
              </button>
              <button
                onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition duration-200 hover:scale-105 active:scale-95"
                title={isMobileMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-navigation"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {isMobileMenuOpen && (
            <div
              id="mobile-navigation"
              className="md:hidden border-t border-slate-200/70 bg-white/95 dark:border-slate-700/70 dark:bg-slate-900/95 animate-slide-down"
            >
              <div className="px-4 py-4 space-y-1">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={false}
                    onClick={closeMobileMenu}
                    className={`block rounded-lg px-3 py-3 text-lg font-medium transition duration-200 ${
                      isActive(item.href)
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                        : "text-slate-700 hover:bg-slate-100 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>
      </header>
    </div>
  );
}
