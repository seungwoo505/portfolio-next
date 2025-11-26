"use client";
import Link from "next/link";
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  HomeIcon, 
  DocumentTextIcon, 
  FolderIcon, 
  UserGroupIcon, 
  CogIcon, 
  TagIcon,
  EnvelopeIcon,
  ChartBarIcon,
  WrenchScrewdriverIcon,
  HeartIcon,
  BriefcaseIcon,
  UserIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
const navigation = [
  { name: '대시보드', href: '/admin', icon: HomeIcon },
  { name: '개인정보 관리', href: '/admin/personal-info', icon: UserIcon },
  { name: '블로그 관리', href: '/admin/blog', icon: DocumentTextIcon },
  { name: '프로젝트 관리', href: '/admin/projects', icon: FolderIcon },
  { name: '관심사 관리', href: '/admin/interests', icon: HeartIcon },
  { name: '경험 관리', href: '/admin/experiences', icon: BriefcaseIcon },
  { name: '태그 관리', href: '/admin/tags', icon: TagIcon },
  { name: '기술 스택 관리', href: '/admin/skills', icon: WrenchScrewdriverIcon },
  { name: '사용자 관리', href: '/admin/users', icon: UserGroupIcon },
  { name: '연락처 관리', href: '/admin/contacts', icon: EnvelopeIcon },
  { name: '활동 로그', href: '/admin/logs', icon: ChartBarIcon },
  { name: '설정', href: '/admin/settings', icon: CogIcon },
];
interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}
/**
 * @description Admin Sidebar for admin sidebar.tsx.
  * @param {*} { isOpen 입력값
  * @param {*} onClose } 입력값
 * @returns {JSX.Element} 처리 결과
 */
export default function AdminSidebar({ isOpen = true, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) {
    return null;
  }
  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/75 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 lg:z-40 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 min-h-screen
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 lg:hidden">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">메뉴</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
          {navigation.map((item) => {
            if (item.href === '/admin') {
              const isActive = pathname === '/admin' || pathname === '/admin/';
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={onClose} 
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-r-2 border-blue-500'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-600'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                </li>
              );
            }
            const isActive = pathname === item.href || 
              pathname === item.href + '/' ||
              (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  onClick={onClose} 
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-r-2 border-blue-500'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-600'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
    </>
  );
}
