"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
/**
 * @component Header
 * @description 네비게이션, 테마 토글, 모바일 메뉴를 포함한 전역 헤더를 렌더링합니다.
 * @returns {JSX.Element} 주요 네비게이션을 담은 고정형 헤더 요소를 반환합니다.
 */
export default function Header() {
  const [isDarkMode, setIsDarkMode] = useState<boolean | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => {
    setIsClient(true);
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
   * @function toggleMobileMenu
   * @description 모바일 네비게이션 드로어의 표시 상태를 전환합니다.
   * @returns {void}
   */
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  /**
   * @function closeMobileMenu
   * @description 모바일 네비게이션 드로어를 강제로 닫습니다.
   * @returns {void}
   */
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };
  return (
    <div 
      className="sticky top-0 z-50 w-full backdrop-blur-md border-b border-slate-200 bg-white/95 safari-header-light dark:border-slate-700 dark:bg-slate-900/95 dark:safari-header-dark"
    >
      <header className="w-full">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div 
            className="flex items-center space-x-4 transition-transform duration-200 hover:-translate-y-1 hover:scale-[1.02]"
          >
            <Link href="/">
              <h1 
                className="text-xl font-bold"
                style={{
                  background: 'linear-gradient(to right, #2563eb, #9333ea)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  color: 'transparent'
                }}
              >
                승우.dev
              </h1>
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <div className="transition-transform duration-200 hover:-translate-y-1 hover:scale-[1.02]">
              <Link 
                href="/" 
                className={`transition-colors ${
                  pathname === "/" 
                    ? "text-blue-600 dark:text-blue-400 font-semibold" 
                    : "text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
                }`}
              >
                홈
              </Link>
            </div>
            <div className="transition-transform duration-200 hover:-translate-y-1 hover:scale-[1.02]">
              <Link 
                href="/about" 
                className={`transition-colors ${
                  pathname.startsWith("/about") 
                    ? "text-blue-600 dark:text-blue-400 font-semibold" 
                    : "text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
                }`}
              >
                소개
              </Link>
            </div>
            <div className="transition-transform duration-200 hover:-translate-y-1 hover:scale-[1.02]">
              <Link 
                href="/blog" 
                className={`transition-colors ${
                  pathname.startsWith("/blog") 
                    ? "text-blue-600 dark:text-blue-400 font-semibold" 
                    : "text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
                }`}
              >
                블로그
              </Link>
            </div>
            <div className="transition-transform duration-200 hover:-translate-y-1 hover:scale-[1.02]">
              <Link 
                href="/projects" 
                className={`transition-colors ${
                  pathname.startsWith("/projects") 
                    ? "text-blue-600 dark:text-blue-400 font-semibold" 
                    : "text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
                }`}
              >
                프로젝트
              </Link>
            </div>
            <div className="transition-transform duration-200 hover:-translate-y-1 hover:scale-[1.02]">
              <Link 
                href="/contact" 
                className={`transition-colors ${
                  pathname.startsWith("/contact") 
                    ? "text-blue-600 dark:text-blue-400 font-semibold" 
                    : "text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
                }`}
              >
                연락처
              </Link>
            </div>
            {isClient && (
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition duration-200 hover:scale-105 active:scale-95"
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
          </div>
          <div className="md:hidden flex items-center space-x-2">
            {isClient && (
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition duration-200 hover:scale-105 active:scale-95"
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
              onClick={toggleMobileMenu}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition duration-200 hover:scale-105 active:scale-95"
              title="메뉴 열기"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="md:hidden border-t border-transparent bg-transparent"
            >
              <div className="px-4 py-4 space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Link 
                    href="/" 
                    onClick={closeMobileMenu}
                    className={`block py-2 text-lg font-medium transition-colors ${
                      pathname === "/" 
                        ? "text-blue-600 dark:text-blue-400" 
                        : "text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
                    }`}
                  >
                    홈
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Link 
                    href="/about" 
                    onClick={closeMobileMenu}
                    className={`block py-2 text-lg font-medium transition-colors ${
                      pathname.startsWith("/about") 
                        ? "text-blue-600 dark:text-blue-400" 
                        : "text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
                    }`}
                  >
                    소개
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Link 
                    href="/blog" 
                    onClick={closeMobileMenu}
                    className={`block py-2 text-lg font-medium transition-colors ${
                      pathname.startsWith("/blog") 
                        ? "text-blue-600 dark:text-blue-400" 
                        : "text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
                    }`}
                  >
                    블로그
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Link 
                    href="/projects" 
                    onClick={closeMobileMenu}
                    className={`block py-2 text-lg font-medium transition-colors ${
                      pathname.startsWith("/projects") 
                        ? "text-blue-600 dark:text-blue-400" 
                        : "text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
                    }`}
                  >
                    프로젝트
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Link 
                    href="/contact" 
                    onClick={closeMobileMenu}
                    className={`block py-2 text-lg font-medium transition-colors ${
                      pathname.startsWith("/contact") 
                        ? "text-blue-600 dark:text-blue-400" 
                        : "text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
                    }`}
                  >
                    연락처
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </nav>
      </header>
    </div>
  );
}
