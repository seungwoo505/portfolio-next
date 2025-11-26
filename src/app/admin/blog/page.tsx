"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/contexts/AdminContext';
import ConfirmModal from '@/components/ConfirmModal';
import { 
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Tag,
  Star,
  StarOff
} from 'lucide-react';
import { authApi } from '@/lib/api';
import { BlogPost } from '@/types';
/**
 * @description 블로그 포스트를 관리하는 관리자 페이지입니다.
 * @returns {JSX.Element} 블로그 관리 페이지 컴포넌트.
 */
export default function BlogManagement() {
  const { isAuthenticated, isLoading } = useAdmin();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; postSlug: string | null }>({
    isOpen: false,
    postSlug: null
  });
  const router = useRouter();
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/admin-login');
    }
  }, [isAuthenticated, isLoading, router]);
  useEffect(() => {
    /**
     * @description 블로그 포스트 목록을 불러옵니다.
     * @returns {Promise<void>}
     */
    const fetchPosts = async () => {
      if (!isAuthenticated) return;
      try {
        setLoading(true);
        const response = await authApi.get('/admin/blog/posts');
        if (response.success && response.data) {
          const postsData = response.data as Array<{
            id: string;
            title: string;
            content: string;
            excerpt: string;
            slug: string;
            meta_description: string;
            meta_keywords: string;
            featured_image: string;
            is_published: boolean;
            tags: { id: string; name: string; color?: string; type?: string }[] | string[];
            created_at: string;
            updated_at: string;
            view_count?: number;
          }>;
          const postsWithTags = postsData.map(post => {
            let processedTags: Array<{ id: string; name: string; color: string; slug: string }> = [];
            if (post.tags) {
              if (typeof post.tags === 'string') {
                processedTags = (post.tags as string).split(',').map((tagName, index) => ({
                  id: `${post.id}-tag-${index}`,
                  name: tagName.trim(),
                  color: '#3b82f6',
                  slug: tagName.trim().toLowerCase().replace(/\s+/g, '-')
                }));
              } else if (Array.isArray(post.tags)) {
                processedTags = post.tags.map((tag, index) => {
                  if (typeof tag === 'string') {
                    return {
                      id: `${post.id}-tag-${index}`,
                      name: tag,
                      color: '#3b82f6',
                      slug: tag.toLowerCase().replace(/\s+/g, '-')
                    };
                  } else {
                    return {
                      id: tag.id || `${post.id}-tag-${index}`,
                      name: tag.name || '',
                      color: tag.color || '#3b82f6',
                      slug: (tag.name || '').toLowerCase().replace(/\s+/g, '-')
                    };
                  }
                });
              }
            }
            return {
              ...post,
              tags: processedTags,
              view_count: post.view_count || 0
            };
          });
          setPosts(postsWithTags);
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('요청이 너무 많습니다')) {
          toast.error('API 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
        } else {
          toast.error('포스트를 가져오는데 실패했습니다.');
        }
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [isAuthenticated]);
  /**
   * @description 삭제 확인 모달을 엽니다.
   * @param {string} postSlug 삭제할 포스트 슬러그.
   * @returns {void}
   */
  const openDeleteModal = (postSlug: string) => {
    setDeleteModal({ isOpen: true, postSlug });
  };
  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, postSlug: null });
  };
  /**
   * @description 선택한 포스트를 삭제합니다.
   * @returns {Promise<void>}
   */
  const deletePost = async () => {
    if (!deleteModal.postSlug) return;
    try {
      await authApi.delete(`/admin/blog/posts/slug/${deleteModal.postSlug}`);
      setPosts(prev => prev.filter(post => post.slug !== deleteModal.postSlug));
      toast.success('포스트가 삭제되었습니다.');
    } catch {
      toast.error('포스트 삭제에 실패했습니다.');
    }
  };
  /**
   * @description 포스트의 발행 상태를 전환합니다.
   * @param {string} postSlug 대상 포스트 슬러그.
   * @param {boolean} currentStatus 현재 발행 상태.
   * @returns {Promise<void>}
   */
  const togglePublishStatus = async (postSlug: string, currentStatus: boolean) => {
    try {
      await authApi.put(`/admin/blog/posts/slug/${postSlug}/publish`, {
        is_published: !currentStatus
      });
      setPosts(prev => prev.map(post => 
        post.slug === postSlug ? { ...post, is_published: !currentStatus } : post
      ));
      toast.success(!currentStatus ? '포스트가 발행되었습니다!' : '포스트가 비발행 상태로 변경되었습니다!');
    } catch {
      toast.error('포스트 상태 변경에 실패했습니다.');
    }
  };
  /**
   * @description 포스트의 추천 상태를 전환합니다.
   * @param {string} postSlug 대상 포스트 슬러그.
   * @param {boolean} currentStatus 현재 추천 상태.
   * @returns {Promise<void>}
   */
  const toggleFeaturedStatus = async (postSlug: string, currentStatus: boolean) => {
    try {
      await authApi.put(`/admin/blog/posts/slug/${postSlug}/featured`, {
        is_featured: !currentStatus
      });
      setPosts(prev => prev.map(post => 
        post.slug === postSlug ? { ...post, featured: !currentStatus } : post
      ));
      toast.success(!currentStatus ? '포스트가 추천되었습니다!' : '포스트 추천이 해제되었습니다!');
    } catch {
      toast.error('추천 상태 변경에 실패했습니다.');
    }
  };
  const filteredPosts = posts.filter(post => {
    const matchesSearch = !searchQuery || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags?.some(tag => tag.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'published' && post.is_published) ||
      (statusFilter === 'draft' && !post.is_published);
    return matchesSearch && matchesStatus;
  });
  /**
   * @description 날짜 문자열을 한국어 표기 형식으로 변환합니다.
   * @param {string} dateString 날짜 문자열.
   * @returns {string} 변환된 날짜 문자열.
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
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
              블로그 포스트 관리
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              블로그에 표시될 포스트들을 관리하세요
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0">
            <Link
              href="/admin/blog/new"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              새 포스트
            </Link>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                검색
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="포스트 제목 또는 내용으로 검색..."
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
                결과
              </label>
              <div className="px-3 py-2 bg-slate-100 dark:bg-slate-600 rounded-lg text-slate-700 dark:text-slate-300">
                {filteredPosts.length}개
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-slate-400 dark:text-slate-500 mb-4">
                <Tag className="mx-auto h-12 w-12" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                포스트가 없습니다
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                {searchQuery || statusFilter !== 'all'
                  ? '검색 조건에 맞는 포스트가 없습니다.'
                  : '첫 번째 포스트를 추가해보세요!'}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Link
                  href="/admin/blog/new"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  새 포스트 추가
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="block lg:hidden space-y-4">
                {filteredPosts.map((post) => (
                  <div key={post.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
                    <div className="flex items-start space-x-3">
                      {post.featured_image && (
                        <Image
                          src={post.featured_image}
                          alt={post.title}
                          width={60}
                          height={60}
                          className="w-15 h-15 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-slate-900 dark:text-white line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {post.excerpt}
                        </p>
                        {post.tags && post.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {post.tags.slice(0, 3).map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                              >
                                {tag.name}
                              </span>
                            ))}
                            {post.tags.length > 3 && (
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                +{post.tags.length - 3}개
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">상태:</span>
                        <span className={`ml-1 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          post.is_published
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {post.is_published ? '발행됨' : '임시저장'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">생성일:</span>
                        <p className="text-slate-900 dark:text-white">
                          {new Date(post.created_at).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        수정: {new Date(post.updated_at).toLocaleDateString('ko-KR')}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/admin/blog/edit?slug=${post.slug}`}
                          className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          title="수정"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => openDeleteModal(post.slug)}
                          className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead className="bg-slate-50 dark:bg-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                        포스트
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                        태그
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                        생성일
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                        추천
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
                  {filteredPosts.map((post) => (
                    <tr key={post.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {post.featured_image && (
                            <Image
                              src={post.featured_image}
                              alt={post.title}
                              width={48}
                              height={48}
                              className="w-12 h-12 rounded-lg object-cover mr-4"
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-slate-900 dark:text-white">
                              {post.title}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                              {post.excerpt || post.content.substring(0, 100) + '...'}
                            </div>
                            <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                              조회수: {post.view_count || 0}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {post.tags && post.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag.id}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                            >
                              {tag.name}
                            </span>
                          ))}
                          {post.tags && post.tags.length > 3 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              +{post.tags.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900 dark:text-white">
                          {formatDate(post.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => togglePublishStatus(post.slug, post.is_published)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            post.is_published
                              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                          } hover:opacity-80 transition-opacity`}
                        >
                          {post.is_published ? (
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
                          onClick={() => toggleFeaturedStatus(post.slug, post.featured || false)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            post.featured
                              ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                          } hover:opacity-80 transition-opacity`}
                        >
                          {post.featured ? (
                            <>
                              <Star className="w-3 h-3 mr-1" />
                              추천
                            </>
                          ) : (
                            <>
                              <StarOff className="w-3 h-3 mr-1" />
                              일반
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                        {formatDate(post.updated_at)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            href={`/admin/blog/edit?slug=${post.slug}`}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-200"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => openDeleteModal(post.slug)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={deletePost}
        title="포스트 삭제"
        message="정말로 이 포스트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmText="삭제"
        cancelText="취소"
        isDestructive={true}
      />
    </div>
  );
}