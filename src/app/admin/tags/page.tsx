"use client";
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/contexts/AdminContext';
import ConfirmModal from '@/components/ConfirmModal';
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  Tag,
  Hash,
  Type
} from 'lucide-react';
import { authApi } from '@/lib/api';
import TagModal from './components/TagModal';
import { AdminBlogTag } from '@/types';
import { ensureApiSuccess, getErrorMessage } from '@/utils/api-response';
import {
  AdminErrorState,
  AdminEmptyState,
  AdminListSkeleton,
  AdminPageLoading,
} from '../components/AdminState';
/**
 * @description 태그를 조회·검색·편집·삭제할 수 있는 관리자 페이지입니다.
 * @returns {JSX.Element} 태그 관리 페이지 컴포넌트.
 */
export default function TagsManagement() {
  const { isAuthenticated, isLoading } = useAdmin();
  const [tags, setTags] = useState<AdminBlogTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'blog' | 'project' | 'general'>('all');
  const [showNewTagModal, setShowNewTagModal] = useState(false);
  const [editingTag, setEditingTag] = useState<AdminBlogTag | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; tagId: string | null }>({
    isOpen: false,
    tagId: null
  });
  const router = useRouter();
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const type = urlParams.get('type');
      if (type && ['blog', 'project', 'general'].includes(type)) {
        setTypeFilter(type as 'blog' | 'project' | 'general');
      }
    }
  }, []);
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/admin-login');
    }
  }, [isAuthenticated, isLoading, router]);
  /**
   * @description 태그 목록을 불러옵니다.
   * @returns {Promise<void>}
   */
  const fetchTags = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      setLoadError(null);
      const response = await authApi.get('/admin/tags');
      ensureApiSuccess(response, '태그를 가져오는데 실패했습니다.');
      setTags((response.data || []) as AdminBlogTag[]);
    } catch (error) {
      const errorMessage = getErrorMessage(error, '태그를 가져오는데 실패했습니다.');
      setLoadError(errorMessage);
      setTags([]);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);
  useEffect(() => {
    fetchTags();
  }, [fetchTags]);
  /**
   * @description 삭제 모달을 엽니다.
   * @param {string} tagId 삭제할 태그 ID.
   * @returns {void}
   */
  const openDeleteModal = (tagId: string) => {
    setDeleteModal({ isOpen: true, tagId });
  };
  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, tagId: null });
  };
  /**
   * @description 선택한 태그를 삭제합니다.
   * @returns {Promise<void>}
   */
  const deleteTag = async () => {
    if (!deleteModal.tagId) return;
    try {
      const response = await authApi.delete(`/admin/tags/${deleteModal.tagId}`);
      ensureApiSuccess(response, '태그 삭제에 실패했습니다.');
      setTags(prev => prev.filter(tag => tag.id !== deleteModal.tagId));
      toast.success('태그가 삭제되었습니다.');
    } catch (error) {
      toast.error(getErrorMessage(error, '태그 삭제에 실패했습니다.'));
    }
  };
  /**
   * @description 태그 저장 후 목록을 갱신합니다.
   * @param {AdminBlogTag} savedTag 저장된 태그.
   * @returns {void}
   */
  const handleTagSaved = (savedTag: AdminBlogTag) => {
    if (editingTag) {
      setTags(prev => prev.map(tag => 
        tag.id === savedTag.id ? savedTag : tag
      ));
      setEditingTag(null);
      toast.success('태그가 수정되었습니다.');
    } else {
      setTags(prev => [savedTag, ...prev]);
      toast.success('태그가 생성되었습니다.');
    }
    setShowNewTagModal(false);
  };
  /**
   * @description 모달을 닫고 편집 상태를 초기화합니다.
   * @returns {void}
   */
  const handleCloseModal = () => {
    setShowNewTagModal(false);
    setEditingTag(null);
  };
  /**
   * @description 태그 유형에 따른 라벨과 아이콘 정보를 반환합니다.
   * @param {string} type 태그 유형.
   * @returns {{ label: string; color: string; icon: typeof Tag }} 유형 정보.
   */
  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'blog':
        return { 
          label: '블로그', 
          color: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
          icon: Tag 
        };
      case 'project':
        return { 
          label: '프로젝트', 
          color: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
          icon: Hash 
        };
      case 'general':
        return { 
          label: '일반', 
          color: 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200',
          icon: Type 
        };
      default:
        return { 
          label: '알 수 없음', 
          color: 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200',
          icon: Tag 
        };
    }
  };
  const filteredTags = tags.filter(tag => {
    const matchesSearch = !searchQuery || 
      tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tag.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tag.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || tag.type === typeFilter;
    return matchesSearch && matchesType;
  });
  if (isLoading) {
    return <AdminPageLoading />;
  }
  if (!isAuthenticated) {
    return null;
  }
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              태그 목록
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              전체 {tags.length}개의 태그 • 필터링된 결과: {filteredTags.length}개
            </p>
          </div>
          <button 
            onClick={() => setShowNewTagModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>새 태그</span>
          </button>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="태그명, 슬러그, 설명 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex flex-wrap space-x-2">
              {[
                { key: 'all', label: '전체' },
                { key: 'blog', label: '블로그' },
                { key: 'project', label: '프로젝트' },
                { key: 'general', label: '일반' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTypeFilter(key as 'all' | 'blog' | 'project' | 'general')}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                    typeFilter === key
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          {loading ? (
            <AdminListSkeleton rows={8} />
          ) : loadError ? (
            <AdminErrorState
              embedded
              description={loadError}
              onRetry={fetchTags}
            />
          ) : filteredTags.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTags.map((tag) => {
                const typeInfo = getTypeInfo(tag.type);
                const TypeIcon = typeInfo.icon;
                return (
                  <div 
                    key={tag.id} 
                    className="relative group p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-600 transition-all hover:shadow-md"
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: tag.color || '#3b82f6' }}
                      ></div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {tag.name}
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                        <TypeIcon className="w-3 h-3 mr-1" />
                        {typeInfo.label}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {tag.usage_count || 0}회
                      </span>
                    </div>
                    {tag.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                        {tag.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        {new Date(tag.created_at).toLocaleDateString('ko-KR')}
                      </span>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingTag(tag)}
                          className="p-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded"
                          title="편집"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(tag.id)}
                          className="p-1.5 text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <AdminEmptyState
              embedded
              icon={Tag}
              title={searchQuery || typeFilter !== 'all' ? '검색 결과가 없습니다' : '태그가 없습니다'}
              description={
                searchQuery || typeFilter !== 'all'
                  ? '다른 검색어나 유형 필터로 다시 확인해보세요.'
                  : '새 태그를 만들면 블로그와 프로젝트 분류에 사용할 수 있습니다.'
              }
              action={
                !searchQuery && typeFilter === 'all'
                  ? { label: '새 태그', onClick: () => setShowNewTagModal(true), icon: Plus }
                  : undefined
              }
            />
          )}
        </div>
        <ConfirmModal
          isOpen={deleteModal.isOpen}
          onClose={closeDeleteModal}
          onConfirm={deleteTag}
          title="태그 삭제"
          message="정말로 이 태그를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
          confirmText="삭제"
          cancelText="취소"
          isDestructive={true}
        />
        <TagModal 
          isOpen={showNewTagModal || !!editingTag}
          onClose={handleCloseModal}
          onTagSaved={handleTagSaved}
          editingTag={editingTag}
          defaultType={typeFilter !== 'all' ? typeFilter : undefined}
        />
      </div>
    </div>
  );
}
