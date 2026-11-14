"use client";
import Link from "next/link";
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import {
  BarChart3,
  Briefcase,
  FileText,
  Folder,
  Heart,
  Home,
  Mail,
  Settings,
  Tag,
  User,
  Users,
  Wrench,
  X,
} from 'lucide-react';
const navigation = [
  { name: '대시보드', href: '/admin', icon: Home },
  { name: '개인정보 관리', href: '/admin/personal-info', icon: User },
  { name: '블로그 관리', href: '/admin/blog', icon: FileText },
  { name: '프로젝트 관리', href: '/admin/projects', icon: Folder },
  { name: '관심사 관리', href: '/admin/interests', icon: Heart },
  { name: '경험 관리', href: '/admin/experiences', icon: Briefcase },
  { name: '태그 관리', href: '/admin/tags', icon: Tag },
  { name: '기술 스택 관리', href: '/admin/skills', icon: Wrench },
  { name: '사용자 관리', href: '/admin/users', icon: Users },
  { name: '연락처 관리', href: '/admin/contacts', icon: Mail },
  { name: '활동 로그', href: '/admin/logs', icon: BarChart3 },
  { name: '설정', href: '/admin/settings', icon: Settings },
];
interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AdminSidebar({ isOpen = true, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const previousPath = useRef(pathname);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const sync = () => {
      setIsDesktop(media.matches);
      if (media.matches) onCloseRef.current?.();
    };
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (previousPath.current !== pathname) {
      previousPath.current = pathname;
      onCloseRef.current?.();
    }
  }, [pathname]);

  if (isDesktop === null) return null;
  const menu = (
    <nav className="p-4 lg:px-5 lg:py-6" aria-label="관리자 메뉴">
      <p className="mb-4 px-3 text-xs font-semibold tracking-wide text-zinc-400 dark:text-zinc-500">콘텐츠 관리</p>
      <ul className="space-y-1">{navigation.map(item => {
        const isActive = item.href === '/admin' ? pathname === '/admin' || pathname === '/admin/' : pathname === item.href || pathname === item.href + '/' || pathname.startsWith(item.href);
        return <li key={item.name}><Link href={item.href} onClick={onClose} aria-current={isActive ? 'page' : undefined} className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${isActive ? 'bg-teal-50 font-semibold text-teal-800 dark:bg-teal-950/40 dark:text-teal-300' : 'font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100'}`}><item.icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-zinc-400 dark:text-zinc-500'}`} /><span>{item.name}</span></Link></li>;
      })}</ul>
      <div className="mt-6 border-t border-zinc-200 pt-4 dark:border-zinc-800"><Link href="/" onClick={onClose} className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"><Home className="h-[18px] w-[18px]" />공개 사이트 보기<span className="ml-auto" aria-hidden="true">↗</span></Link></div>
    </nav>
  );

  if (isDesktop) return (
    <aside id="admin-navigation" className="hidden w-64 shrink-0 overflow-y-auto lg:sticky lg:top-28 lg:block lg:max-h-[calc(100dvh-7rem)] lg:self-start">{menu}</aside>
  );

  return (
    <Dialog open={isOpen} onClose={() => onCloseRef.current?.()} initialFocus={closeButton} className="admin-shell fixed inset-0 z-[60] lg:hidden" style={{ background: 'transparent' }}>
      <DialogBackdrop transition className="fixed inset-0 bg-zinc-950/50 backdrop-blur-sm transition-opacity duration-200 data-closed:opacity-0 motion-reduce:transition-none" />
      <DialogPanel as="aside" id="admin-navigation" transition className="fixed inset-y-0 left-0 w-64 max-w-full overflow-y-auto border-r border-zinc-200 bg-white transition-transform duration-200 data-closed:-translate-x-full motion-reduce:transition-none dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-800">
          <DialogTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">관리자 메뉴</DialogTitle>
          <button ref={closeButton} type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800" aria-label="관리자 메뉴 닫기"><X className="h-5 w-5" /></button>
        </div>
        {menu}
      </DialogPanel>
    </Dialog>
  );
}