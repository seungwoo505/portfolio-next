'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { personalApi, skillApi, authApi, api } from '@/lib/api';
import { Skill } from '@/types';
import SkillModal from './components/SkillModal';
import ConfirmModal from '@/components/ConfirmModal';
import toast from 'react-hot-toast';
import { ensureApiSuccess, getErrorMessage } from '@/utils/api-response';
import {
  AdminErrorState,
  AdminEmptyState,
  AdminListSkeleton,
} from '../components/AdminState';
/**
 * @description 기술 스택을 조회·관리할 수 있는 관리자 페이지입니다.
 * @returns {JSX.Element} 기술 관리 페이지 컴포넌트.
 */
export default function AdminSkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; skillId: string | null }>({
    isOpen: false,
    skillId: null
  });
  const categoryInputRef = useRef<HTMLInputElement>(null);
  const hasCategoryModalMountedRef = useRef(false);
  /**
   * @description 모든 기술과 카테고리 정보를 불러옵니다.
   * @returns {Promise<void>}
   */
  const loadSkills = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const response = await personalApi.getSkills();
      ensureApiSuccess(response, '기술 스택을 불러올 수 없습니다.');
      setSkills(response.data?.skills || []);
      setCategories(response.data?.categories || []);
    } catch (error) {
      const errorMessage = getErrorMessage(error, '기술 스택을 불러오는 중 오류가 발생했습니다.');
      setLoadError(errorMessage);
      setSkills([]);
      setCategories([]);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    loadSkills();
  }, [loadSkills]);
  const handleSaveSkill = async (skillData: Partial<Skill>): Promise<{ success: boolean; message?: string }> => {
    try {
      if (editingSkill) {
        const response = await skillApi.updateSkill(editingSkill.id, skillData);
        ensureApiSuccess(response, '기술 스택 저장 중 오류가 발생했습니다.');
        await loadSkills();
        return { success: true, message: '기술 스택이 수정되었습니다.' };
      } else {
        const response = await skillApi.createSkill(skillData);
        ensureApiSuccess(response, '기술 스택 저장 중 오류가 발생했습니다.');
        await loadSkills();
        return { success: true, message: '기술 스택이 추가되었습니다.' };
      }
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, '기술 스택 저장 중 오류가 발생했습니다.')
      };
    }
  };
  /**
   * @description 추천 여부를 전환합니다.
   * @param {string} skillId 기술 ID.
   * @param {boolean} currentStatus 현재 추천 상태.
   * @returns {Promise<void>}
   */
  const toggleFeatured = async (skillId: string, currentStatus: boolean) => {
    try {
      const response = await skillApi.toggleFeatured(skillId, !currentStatus);
      ensureApiSuccess(response, '추천 상태 변경 중 오류가 발생했습니다.');
      await loadSkills();
      toast.success(!currentStatus ? '기술 스택이 추천 목록에 추가되었습니다!' : '기술 스택이 추천 목록에서 제거되었습니다!');
    } catch (error) {
      toast.error(getErrorMessage(error, '추천 상태 변경 중 오류가 발생했습니다.'));
    }
  };
  /**
   * @description 삭제 확인 모달을 엽니다.
   * @param {string} skillId 삭제할 기술 ID.
   * @returns {void}
   */
  const openDeleteModal = (skillId: string) => {
    setDeleteModal({ isOpen: true, skillId });
  };
  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, skillId: null });
  };
  /**
   * @description 선택한 기술을 삭제합니다.
   * @returns {Promise<void>}
   */
  const deleteSkill = async () => {
    if (!deleteModal.skillId) return;
    try {
      const response = await skillApi.deleteSkill(deleteModal.skillId);
      ensureApiSuccess(response, '기술 스택 삭제 중 오류가 발생했습니다.');
      await loadSkills();
      toast.success('기술 스택이 삭제되었습니다.');
    } catch (error) {
      toast.error(getErrorMessage(error, '기술 스택 삭제 중 오류가 발생했습니다.'));
    }
  };
  /**
   * @description 기술 수정 모달을 엽니다.
   * @param {Skill} skill 편집할 기술.
   * @returns {void}
   */
  const openEditModal = (skill: Skill) => {
    setEditingSkill(skill);
    setIsModalOpen(true);
  };
  const openAddModal = () => {
    setEditingSkill(null);
    setIsModalOpen(true);
  };
  /**
   * @description 기술 모달을 닫고 상태를 초기화합니다.
   * @returns {void}
   */
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSkill(null);
  };
  /**
   * @description 새 카테고리를 추가합니다.
   * @param {string} name 카테고리 이름.
   * @returns {Promise<void>}
   */
  const handleAddCategory = async (name: string) => {
    try {
      const response = await authApi.createCategory(name);
      ensureApiSuccess(response, '카테고리 추가에 실패했습니다.');
      const skillsResponse = await api.get<{ skills: Skill[]; categories: Array<{ id: string; name: string }>; skillsByCategory: unknown[] }>('/skills');
      ensureApiSuccess(skillsResponse, '카테고리 목록을 새로고침하지 못했습니다.');
      setCategories(skillsResponse.data?.categories || []);
      if (categoryInputRef.current) {
        categoryInputRef.current.value = '';
      }
      toast.success('카테고리가 추가되었습니다.');
    } catch (error) {
      toast.error(getErrorMessage(error, '카테고리 추가에 실패했습니다.'));
    }
  };
  /**
   * @description 카테고리를 삭제합니다.
   * @param {string} categoryId 카테고리 ID.
   * @returns {Promise<void>}
   */
  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const response = await authApi.deleteCategory(categoryId);
      ensureApiSuccess(response, '카테고리 삭제에 실패했습니다.');
      const skillsResponse = await api.get<{ skills: Skill[]; categories: Array<{ id: string; name: string }>; skillsByCategory: unknown[] }>('/skills');
      ensureApiSuccess(skillsResponse, '카테고리 목록을 새로고침하지 못했습니다.');
      setCategories(skillsResponse.data?.categories || []);
      toast.success('카테고리가 삭제되었습니다.');
    } catch (error) {
      toast.error(getErrorMessage(error, '카테고리 삭제에 실패했습니다.'));
    }
  };
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (isModalOpen || isCategoryModalOpen) {
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
      } else {
        document.body.style.overflow = 'unset';
        document.body.style.position = 'unset';
        document.body.style.width = 'unset';
      }
    }
    return () => {
      if (typeof window !== 'undefined') {
        document.body.style.overflow = 'unset';
        document.body.style.position = 'unset';
        document.body.style.width = 'unset';
      }
    };
  }, [isModalOpen, isCategoryModalOpen]);
  useEffect(() => {
    if (!hasCategoryModalMountedRef.current) {
      hasCategoryModalMountedRef.current = true;
      return;
    }
    if (!isCategoryModalOpen) {
      loadSkills();
    }
  }, [isCategoryModalOpen, loadSkills]);
  if (loading) {
    return (
      <div className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <AdminListSkeleton rows={5} variant="table" />
        </div>
      </div>
    );
  }
  if (loadError) {
    return (
      <div className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <AdminErrorState
            title="기술 스택을 불러오지 못했습니다"
            description={loadError}
            onRetry={loadSkills}
          />
        </div>
      </div>
    );
  }
  return (
    <div className="min-w-0 flex-1">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              기술 스택 관리
            </h1>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
              <button 
                onClick={() => setIsCategoryModalOpen(true)}
                className="rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
              >
                카테고리 관리
              </button>
              <button 
                onClick={openAddModal}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
              >
                새 기술 스택 추가
              </button>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
            {skills.length > 0 ? (
              <>
                <div className="divide-y divide-gray-200 dark:divide-slate-700 lg:hidden">
                  {skills.map((skill) => (
                    <article key={skill.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="truncate text-base font-semibold text-gray-900 dark:text-white">
                            {skill.name}
                          </h2>
                          <p className="mt-1 text-sm text-gray-500 dark:text-slate-300">
                            {skill.category_name || '카테고리 없음'}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <button
                            onClick={() => openEditModal(skill)}
                            className="inline-flex h-9 items-center rounded-md px-3 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-900 dark:text-blue-400 dark:hover:bg-blue-900/30 dark:hover:text-blue-300"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => openDeleteModal(skill.id)}
                            className="inline-flex h-9 items-center rounded-md px-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-900 dark:text-red-400 dark:hover:bg-red-900/30 dark:hover:text-red-300"
                          >
                            삭제
                          </button>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-700 dark:text-slate-300">숙련도</span>
                          <span className="text-gray-500 dark:text-slate-300">{skill.proficiency_level || 0}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-slate-600">
                          <div
                            className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                            style={{ width: `${Math.max(0, Math.min(100, skill.proficiency_level || 0))}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => toggleFeatured(skill.id, skill.is_featured)}
                          className={`inline-flex min-h-8 items-center rounded-full px-3 py-1 text-xs font-medium ${
                            skill.is_featured
                              ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-white'
                              : 'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-white'
                          }`}
                        >
                          {skill.is_featured ? '추천' : '일반'}
                        </button>
                        <span className="inline-flex min-h-8 items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-slate-700 dark:text-slate-300">
                          순서 {skill.display_order}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="hidden overflow-x-auto lg:block">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                  <thead className="bg-gray-50 dark:bg-slate-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">
                        기술명
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">
                        카테고리
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">
                        숙련도
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">
                        추천
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">
                        순서
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-300 uppercase tracking-wider">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                    {skills.map((skill) => (
                      <tr key={skill.id} className="hover:bg-gray-50 dark:hover:bg-slate-600">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {skill.name}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-300">
                          {skill.category_name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-20 bg-gray-200 dark:bg-slate-600 rounded-full h-2 mr-2 overflow-hidden relative">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300 absolute left-0 top-0"
                                style={{
                                  width: `${Math.max(0, Math.min(100, skill.proficiency_level || 0))}%`,
                                  opacity: (skill.proficiency_level || 0) > 0 ? 1 : 0,
                                  transform: (skill.proficiency_level || 0) > 0 ? 'none' : 'translateX(-100%)'
                                }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-500 dark:text-slate-300 min-w-[3rem] text-right">
                              {skill.proficiency_level || 0}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => toggleFeatured(skill.id, skill.is_featured)}
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              skill.is_featured
                                ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-white'
                                : 'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-white'
                            }`}
                          >
                            {skill.is_featured ? '추천' : '일반'}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-300">
                          {skill.display_order}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openEditModal(skill)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => openDeleteModal(skill.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </>
            ) : (
              <AdminEmptyState
                embedded
                title="기술 스택이 없습니다"
                description="새 기술 스택을 추가하면 포트폴리오의 기술 영역에 사용할 수 있습니다."
                action={{ label: '새 기술 스택', onClick: openAddModal }}
              />
            )}
          </div>
        </div>
        <SkillModal
          isOpen={isModalOpen}
          onClose={closeModal}
          skill={editingSkill}
          onSave={handleSaveSkill}
          categories={categories}
          keepOpenOnSuccess={!editingSkill} 
        />
        {isCategoryModalOpen && (
          <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md mx-4">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    카테고리 관리
                  </h2>
                  <button
                    onClick={() => setIsCategoryModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="flex space-x-2">
                    <input
                      ref={categoryInputRef}
                      type="text"
                      placeholder="새 카테고리명"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          handleAddCategory(e.currentTarget.value.trim());
                        }
                      }}
                    />
                    <button 
                      onClick={() => {
                        if (categoryInputRef.current && categoryInputRef.current.value.trim()) {
                          handleAddCategory(categoryInputRef.current.value.trim());
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      추가
                    </button>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {categories.map((category) => (
                      <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                        <span className="text-gray-900 dark:text-white">{category.name}</span>
                        <button 
                          onClick={() => handleDeleteCategory(category.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          삭제
                        </button>
                      </div>
                    ))}
                    {categories.length === 0 && (
                      <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                        등록된 카테고리가 없습니다.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={deleteSkill}
        title="기술 스택 삭제"
        message="정말로 이 기술 스택을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmText="삭제"
        cancelText="취소"
        isDestructive={true}
      />
    </div>
  );
}
