"use client";
import Link from "next/link";
import { useState, useLayoutEffect, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, Moon, Sun, X } from "lucide-react";
import "./site/brand-motion.css";

const NAV_ITEMS = [
  { href: "/", label: "홈" },
  { href: "/projects", label: "프로젝트" },
  { href: "/about", label: "소개" },
  { href: "/blog", label: "블로그" },
  { href: "/contact", label: "연락처" },
];

export default function Header() {
  const [isDarkMode, setIsDarkMode] = useState<boolean | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuToggle = useRef<HTMLButtonElement>(null);
  const desktopNavigation = useRef<HTMLElement>(null);
  const activeIndicator = useRef<HTMLSpanElement>(null);
  const lastIndicator = useRef<{ transform: string; width: string } | null>(null);
  const pathname = usePathname();
  useLayoutEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);
  useLayoutEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));
  }, []);

  useLayoutEffect(() => {
    const navigation = desktopNavigation.current;
    const indicator = activeIndicator.current;
    if (!navigation || !indicator) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let animation: Animation | undefined;
    let disposed = false;
    const measure = (animate = false) => {
      if (disposed) return;
      const active = navigation.querySelector<HTMLElement>('[aria-current="page"]');
      const bounds = navigation.getBoundingClientRect();
      if (!active || !bounds.width) {
        animation?.cancel();
        indicator.style.visibility = 'hidden';
        lastIndicator.current = null;
        return;
      }
      const target = active.getBoundingClientRect();
      const next = { transform: `translateX(${target.left - bounds.left}px)`, width: `${target.width}px` };
      const previous = lastIndicator.current;
      const reduced = preference.matches || document.documentElement.classList.contains('reduced-motion');
      if (!animate && animation && previous?.transform === next.transform && previous.width === next.width && !document.hidden && !reduced) return;
      const from = previous ?? next;
      animation?.cancel();
      Object.assign(indicator.style, next, { visibility: 'visible' });
      lastIndicator.current = next;
      if (animate && previous && !document.hidden && !reduced && indicator.animate && (previous.transform !== next.transform || previous.width !== next.width)) {
        animation = indicator.animate([from, next], { duration: 180, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' });
      }
    };
    measure(true);
    const refresh = () => measure();
    const resize = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(refresh) : null;
    resize?.observe(navigation);
    const rootClasses = typeof MutationObserver !== 'undefined' ? new MutationObserver(refresh) : null;
    rootClasses?.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    window.addEventListener('resize', refresh);
    window.addEventListener('pageshow', refresh);
    document.addEventListener('visibilitychange', refresh);
    preference.addEventListener('change', refresh);
    document.fonts?.addEventListener('loadingdone', refresh);
    if (document.fonts?.status === 'loading') void document.fonts.ready.then(refresh);
    return () => {
      disposed = true;
      if (animation && lastIndicator.current) {
        const rendered = getComputedStyle(indicator);
        lastIndicator.current = { transform: rendered.transform, width: rendered.width };
      }
      animation?.cancel();
      resize?.disconnect();
      rootClasses?.disconnect();
      window.removeEventListener('resize', refresh);
      window.removeEventListener('pageshow', refresh);
      document.removeEventListener('visibilitychange', refresh);
      preference.removeEventListener('change', refresh);
      document.fonts?.removeEventListener('loadingdone', refresh);
    };
  }, [pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const desktop = window.matchMedia('(min-width: 768px)');
    const onDesktop = () => { if (desktop.matches) setIsMobileMenuOpen(false); };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setIsMobileMenuOpen(false);
      menuToggle.current?.focus();
    };
    document.addEventListener('keydown', onKeyDown);
    desktop.addEventListener('change', onDesktop);
    return () => { document.removeEventListener('keydown', onKeyDown); desktop.removeEventListener('change', onDesktop); };
  }, [isMobileMenuOpen]);

  const toggleTheme = () => {
    const root = document.documentElement;
    const nextDark = !root.classList.contains('dark');
    const theme = nextDark ? 'dark' : 'light';
    setIsDarkMode(nextDark);
    root.classList.toggle('dark', nextDark);
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;
    try { localStorage.setItem('theme', theme); } catch { /* Theme still works with storage disabled. */ }
    document.cookie = `theme=${theme}; path=/; max-age=31536000`;
  };
  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/70 bg-white/90 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/90">
      <div className="site-container">
        <div className="flex min-h-20 flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
          <Link href="/" prefetch={false} aria-label="승우.dev 홈" className="inline-flex min-h-11 min-w-0 max-w-full items-center gap-2.5 font-semibold tracking-tight">
            <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 font-mono text-sm text-white dark:bg-zinc-100 dark:text-zinc-900">s<span className="text-teal-400 dark:text-teal-600">.</span></span>
            <span className="truncate">승우<span className="muted-text font-normal">.dev</span></span>
          </Link>
          <nav ref={desktopNavigation} aria-label="주요 메뉴" className="brand-navigation hidden items-center gap-1 rounded-full bg-zinc-50 px-2 py-1 ring-1 ring-zinc-900/5 md:flex dark:bg-zinc-800/70 dark:ring-white/10">
            <span ref={activeIndicator} data-nav-indicator aria-hidden="true" className="brand-navigation-indicator" />
            {NAV_ITEMS.map(item => <Link key={item.href} href={item.href} prefetch={false} aria-current={isActive(item.href) ? 'page' : undefined} className={`inline-flex min-h-10 items-center rounded-full px-4 text-sm font-medium ${isActive(item.href) ? 'text-teal-700 dark:text-teal-300' : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100'}`}>{item.label}</Link>)}
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <Link href="/contact" prefetch={false} className="hidden min-h-11 items-center gap-1.5 pr-3 text-xs font-medium text-zinc-600 xl:inline-flex dark:text-zinc-400">연락하기<ArrowUpRight size={14} aria-hidden="true" /></Link>
            <button type="button" onClick={toggleTheme} className="icon-button" aria-label="다크모드 토글" title="테마 전환" suppressHydrationWarning>
              {isDarkMode === null ? <span className="size-4" /> : isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button ref={menuToggle} type="button" onClick={() => setIsMobileMenuOpen(open => !open)} className="icon-button md:hidden" aria-expanded={isMobileMenuOpen} aria-controls="mobile-navigation" aria-label={isMobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'}>{isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}</button>
          </div>
        </div>
        <div className="mobile-menu md:hidden" data-open={isMobileMenuOpen} inert={!isMobileMenuOpen} aria-hidden={!isMobileMenuOpen}><div className="mobile-menu-inner">
        <nav id="mobile-navigation" aria-label="모바일 메뉴" className="grid gap-1 border-t border-zinc-200 py-4 dark:border-zinc-800">
          {NAV_ITEMS.map(item => <Link key={item.href} href={item.href} prefetch={false} onClick={() => setIsMobileMenuOpen(false)} aria-current={isActive(item.href) ? 'page' : undefined} className={`rounded-xl px-4 py-3 text-sm font-medium ${isActive(item.href) ? 'bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-200' : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800'}`}>{item.label}</Link>)}
        </nav></div></div>
      </div>
    </header>
  );
}
