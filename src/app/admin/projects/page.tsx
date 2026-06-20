"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/contexts/AdminContext';
import ConfirmModal from '@/components/ConfirmModal';
import toast from 'react-hot-toast';
import { 
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Star
} from 'lucide-react';
import { authApi } from '@/lib/api';
import { Project } from '@/types';
import { ensureApiSuccess, getErrorMessage } from '@/utils/api-response';
import {
  AdminErrorState,
  AdminEmptyState,
  AdminListSkeleton,
  AdminPageLoading,
} from '../components/AdminState';
/**
 * @description 프로젝트를 검색·필터링·관리할 수 있는 관리자 페이지입니다.
 * @returns {JSX.Element} 프로젝트 관리 페이지 컴포넌트.
 */
export default function ProjectsPage() {
  const { isAuthenticated, isLoading } = useAdmin();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [featuredFilter, setFeaturedFilter] = useState<'all' | 'featured' | 'not-featured'>('all');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; projectSlug: string | null }>({
    isOpen: false,
    projectSlug: null
  });
  const router = useRouter();
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/admin-login');
    }
  }, [isAuthenticated, isLoading, router]);
  const fetchProjects = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      setLoadError(null);
      const response = await authApi.get('/admin/projects');
      ensureApiSuccess(response, '프로젝트를 가져오는데 실패했습니다.');
      setProjects((response.data || []) as Project[]);
    } catch (error) {
      const errorMessage = getErrorMessage(error, '프로젝트를 가져오는데 실패했습니다.');
      setLoadError(errorMessage);
      toast.error(errorMessage);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);
  useEffect(() => {
    /**
     * @description 창 포커스를 다시 얻으면 프로젝트 목록을 갱신합니다.
     * @returns {void}
     */
    const handleFocus = () => {
      fetchProjects();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchProjects]);
  /**
   * @description 삭제 확인 모달을 엽니다.
   * @param {string} projectSlug 삭제할 프로젝트 슬러그.
   * @returns {void}
   */
  const openDeleteModal = (projectSlug: string) => {
    setDeleteModal({ isOpen: true, projectSlug });
  };
  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, projectSlug: null });
  };
  /**
   * @description 선택한 프로젝트를 삭제합니다.
   * @returns {Promise<void>}
   */
  const deleteProject = async () => {
    if (!deleteModal.projectSlug) return;
    try {
      const response = await authApi.delete(`/admin/projects/slug/${deleteModal.projectSlug}`);
      ensureApiSuccess(response, '프로젝트 삭제에 실패했습니다.');
      setProjects(prev => prev.filter(project => project.slug !== deleteModal.projectSlug));
      toast.success('프로젝트가 삭제되었습니다.');
    } catch (error) {
      toast.error(getErrorMessage(error, '프로젝트 삭제에 실패했습니다.'));
    }
  };
  /**
   * @description 프로젝트 게시 상태를 전환합니다.
   * @param {string} projectSlug 대상 프로젝트 슬러그.
   * @param {boolean} currentStatus 현재 게시 상태.
   * @returns {Promise<void>}
   */
  const togglePublishStatus = async (projectSlug: string, currentStatus: boolean) => {
    try {
      const normalizedCurrentStatus = Boolean(currentStatus);
      const newStatus = !normalizedCurrentStatus;
      const response = await authApi.put(`/admin/projects/slug/${projectSlug}`, {
        is_published: newStatus
      });
      ensureApiSuccess(response, '프로젝트 상태 변경에 실패했습니다.');
      await fetchProjects();
      toast.success('프로젝트 상태가 변경되었습니다.');
    } catch (error) {
      toast.error(getErrorMessage(error, '프로젝트 상태 변경에 실패했습니다.'));
    }
  };
  /**
   * @description 프로젝트 대표 상태를 전환합니다.
   * @param {string} projectSlug 대상 프로젝트 슬러그.
   * @param {boolean} currentStatus 현재 대표 상태.
   * @returns {Promise<void>}
   */
  const toggleFeaturedStatus = async (projectSlug: string, currentStatus: boolean) => {
    try {
      const normalizedCurrentStatus = Boolean(currentStatus);
      const newStatus = !normalizedCurrentStatus;
      const response = await authApi.put(`/admin/projects/slug/${projectSlug}`, {
        is_featured: newStatus
      });
      ensureApiSuccess(response, '프로젝트 대표 상태 변경에 실패했습니다.');
      await fetchProjects();
      toast.success('프로젝트 대표 상태가 변경되었습니다.');
    } catch (error) {
      toast.error(getErrorMessage(error, '프로젝트 대표 상태 변경에 실패했습니다.'));
    }
  };
  const filteredProjects = projects.filter(project => {
    const normalizedQuery = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      project.title.toLowerCase().includes(normalizedQuery) ||
      project.description.toLowerCase().includes(normalizedQuery) ||
      (project.tags?.some(tag => {
        if (typeof tag === 'string') {
          return tag.toLowerCase().includes(normalizedQuery);
        }
        if (tag && typeof tag === 'object' && 'name' in tag && typeof tag.name === 'string') {
          return tag.name.toLowerCase().includes(normalizedQuery);
        }
        return false;
      }) ?? false);
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'published' && project.is_published) ||
      (statusFilter === 'draft' && !project.is_published);
    const matchesFeatured = featuredFilter === 'all' || 
      (featuredFilter === 'featured' && project.featured) ||
      (featuredFilter === 'not-featured' && !project.featured);
    return matchesSearch && matchesStatus && matchesFeatured;
  });
  /**
   * @description 날짜 문자열을 한국어 표기 형식으로 변환합니다.
   * @param {string} dateString 날짜 문자열.
   * @returns {string} 변환된 날짜 문자열.
   */
  const formatDate = (dateString?: string) => {
    if (!dateString) {
      return '미정';
    }
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  if (isLoading) {
    return <AdminPageLoading />;
  }
  if (!isAuthenticated) {
    return null;
  }
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              프로젝트 관리
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              포트폴리오에 표시될 프로젝트들을 관리하세요
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0">
            <Link
              href="/admin/projects/new"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              새 프로젝트
            </Link>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                검색
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="프로젝트 제목 또는 설명으로 검색..."
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                상태
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'published' | 'draft')}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="all">전체</option>
                <option value="published">공개</option>
                <option value="draft">비공개</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                대표 프로젝트
              </label>
              <select
                value={featuredFilter}
                onChange={(e) => setFeaturedFilter(e.target.value as 'all' | 'featured' | 'not-featured')}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="all">전체</option>
                <option value="featured">대표 프로젝트</option>
                <option value="not-featured">일반 프로젝트</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                결과
              </label>
              <div className="px-3 py-2 bg-slate-100 dark:bg-slate-600 rounded-lg text-slate-700 dark:text-slate-300">
                {filteredProjects.length}개
              </div>
            </div>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          {loading ? (
            <div className="p-6">
              <AdminListSkeleton rows={5} variant="table" />
            </div>
          ) : loadError ? (
            <AdminErrorState
              embedded
              description={loadError}
              onRetry={fetchProjects}
            />
          ) : filteredProjects.length === 0 ? (
            <AdminEmptyState
              embedded
              icon={Star}
              title={searchQuery || statusFilter !== 'all' || featuredFilter !== 'all' ? '검색 결과가 없습니다' : '프로젝트가 없습니다'}
              description={
                searchQuery || statusFilter !== 'all' || featuredFilter !== 'all'
                  ? '다른 검색어나 필터로 다시 확인해보세요.'
                  : '첫 번째 프로젝트를 작성하면 목록에 표시됩니다.'
              }
              action={
                !searchQuery && statusFilter === 'all' && featuredFilter === 'all'
                  ? { label: '새 프로젝트', href: '/admin/projects/new', icon: Plus }
                  : undefined
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                      프로젝트
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                      기술 스택
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                      기간
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                      대표
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                      조회수
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                      수정일
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredProjects.map((project) => {
                    const tagNames = Array.isArray(project.tags)
                      ? project.tags.map(tag => typeof tag === 'string' ? tag : tag.name)
                      : [];
                    const startDateLabel = formatDate(project.start_date);
                    const endDateLabel = project.end_date ? formatDate(project.end_date) : null;
                    const isPublished = Boolean(project.is_published);
                    return (
                    <tr key={project.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {project.featured_image && (
                            <Image
                              src={project.featured_image}
                              alt={project.title}
                              width={48}
                              height={48}
                              className="w-12 h-12 rounded-lg object-cover mr-4"
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-slate-900 dark:text-white">
                              {project.title}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                              {project.excerpt || project.description || project.content_text?.slice(0, 160)}
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              {project.project_url && (
                                <a
                                  href={project.project_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                                >
                                  프로젝트 링크
                                </a>
                              )}
                              {project.github_url && (
                                <a
                                  href={project.github_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                                >
                                  GitHub
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {tagNames.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                            >
                              {tag}
                            </span>
                          ))}
                          {tagNames.length > 3 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              +{tagNames.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900 dark:text-white">
                          {startDateLabel}
                        </div>
                        {project.end_date && endDateLabel && (
                          <div className="text-sm text-slate-500 dark:text-slate-400">
                            ~ {endDateLabel}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => togglePublishStatus(project.slug, isPublished)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isPublished
                              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                          } hover:opacity-80 transition-opacity cursor-pointer`}
                        >
                          {isPublished ? (
                            <>
                              <Eye className="w-3 h-3 mr-1" />
                              공개
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3 mr-1" />
                              비공개
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleFeaturedStatus(project.slug, project.featured)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            project.featured
                              ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                          } hover:opacity-80 transition-opacity cursor-pointer`}
                        >
                          {project.featured ? (
                            <>
                              <Star className="w-3 h-3 mr-1" />
                              대표
                            </>
                          ) : (
                            <>
                              <Star className="w-3 h-3 mr-1" />
                              일반
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900 dark:text-white">
                          {project.view_count || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                        {formatDate(project.updated_at)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            href={`/admin/projects/edit?slug=${project.slug}`}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-200"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => openDeleteModal(project.slug)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={deleteProject}
        title="프로젝트 삭제"
        message="정말로 이 프로젝트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmText="삭제"
        cancelText="취소"
        isDestructive={true}
      />
    </div>
  );
}
