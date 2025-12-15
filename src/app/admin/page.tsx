"use client";
import Link from "next/link";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/contexts/AdminContext';
import toast from 'react-hot-toast';
import { 
  FileText, 
  Mail, 
  FolderOpen, 
  MessageSquare,
  Eye,
  Shield,
  Tag
} from 'lucide-react';
import { authApi } from '@/lib/api';
import { AdminDashboardStats } from '@/types';
/**
 * @component AdminDashboard
 * @description 관리자 대시보드 요약 통계를 표시하고 주요 관리 페이지로 이동할 수 있게 한다.
 * @returns {JSX.Element} 관리자 대시보드 페이지.
 */
export default function AdminDashboard() {
  const { user, isAuthenticated, isLoading } = useAdmin();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const router = useRouter();
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/admin-login');
    }
  }, [isAuthenticated, isLoading, router]);
  useEffect(() => {
    /**
     * @function fetchStats
     * @description 인증된 사용자를 위해 대시보드 통계를 로드한다.
     * @returns {Promise<void>} 통계 로딩 작업.
     */
    const fetchStats = async () => {
      if (!isAuthenticated) return;
      try {
        setStatsLoading(true);
        const response = await authApi.get('/admin/dashboard');
        if (response.success && response.data) {
          const statsData = response.data as AdminDashboardStats;
          setStats(statsData);
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('요청이 너무 많습니다')) {
          toast.error('API 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
        } else {
          toast.error('대시보드 데이터를 불러올 수 없습니다.');
        }
        setStats({
          blog: { total: 0, published: 0, drafts: 0 },
          projects: { total: 0, featured: 0 },
          contacts: { total: 0, unread: 0 },
          activities: { total: 0, today: 0 }
        });
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, [isAuthenticated]);
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-600 dark:text-slate-400">로딩 중...</span>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return null; 
  }
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">블로그 포스트</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                  {statsLoading ? '...' : stats?.blog.total || 0}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900 rounded-lg flex-shrink-0">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">프로젝트</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                  {statsLoading ? '...' : stats?.projects.total || 0}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900 rounded-lg flex-shrink-0">
                <FolderOpen className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">연락 메시지</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                  {statsLoading ? '...' : stats?.contacts.total || 0}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex-shrink-0">
                <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">관리자 활동</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                  {statsLoading ? '...' : stats?.activities.total || 0}
                </p>
              </div>
              <div className="p-2 sm:p-3 bg-purple-100 dark:bg-purple-900 rounded-lg flex-shrink-0">
                <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Link href="/admin/blog" prefetch={false} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900 rounded-lg flex-shrink-0">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">블로그 관리</h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">포스트 작성 및 관리</p>
              </div>
            </div>
          </Link>
          <Link href="/admin/projects" prefetch={false} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <FolderOpen className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">프로젝트 관리</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">프로젝트 추가 및 수정</p>
              </div>
            </div>
          </Link>
          <Link href="/admin/contacts" prefetch={false} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <Mail className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">연락처 관리</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">수신된 메시지 확인</p>
              </div>
            </div>
          </Link>
          <Link href="/admin/tags" prefetch={false} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Tag className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">태그 & 기술스택</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">태그 및 기술스택 관리</p>
              </div>
            </div>
          </Link>
          {user?.role === 'super_admin' && (
            <Link href="/admin/users" prefetch={false} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">사용자 관리</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">관리자 계정 관리</p>
                </div>
              </div>
            </Link>
          )}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">최근 연락 메시지</h3>
              <Link href="/admin/contacts" prefetch={false} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                전체 보기
              </Link>
            </div>
            <div className="space-y-3">
              {statsLoading ? (
                <div className="animate-pulse space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
                      <div className="flex-1 space-y-1">
                        <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-3/4"></div>
                        <div className="h-3 bg-slate-300 dark:bg-slate-600 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">
                    총 {stats?.contacts.total || 0}개의 메시지
                  </p>
                  {stats?.contacts.unread ? (
                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                      {stats.contacts.unread}개의 읽지 않은 메시지
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">최근 블로그 포스트</h3>
              <Link href="/admin/blog" prefetch={false} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                전체 보기
              </Link>
            </div>
            <div className="space-y-3">
              {statsLoading ? (
                <div className="animate-pulse space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
                      <div className="flex-1 space-y-1">
                        <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-3/4"></div>
                        <div className="h-3 bg-slate-300 dark:bg-slate-600 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">
                    총 {stats?.blog.total || 0}개의 포스트
                  </p>
                  <div className="flex justify-center space-x-4 mt-2 text-sm">
                    <span className="text-green-600 dark:text-green-400">
                      발행: {stats?.blog.published || 0}개
                    </span>
                    <span className="text-yellow-600 dark:text-yellow-400">
                      초안: {stats?.blog.drafts || 0}개
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
