'use client';
import { useState, useEffect, useRef } from 'react';
import { personalApi, skillApi, authApi, api } from '@/lib/api';
import { Skill } from '@/types';
import SkillModal from './components/SkillModal';
import ConfirmModal from '@/components/ConfirmModal';
import toast from 'react-hot-toast';
/**
 * @description 기술 스택을 조회·관리할 수 있는 관리자 페이지입니다.
 * @returns {JSX.Element} 기술 관리 페이지 컴포넌트.
 */
export default function AdminSkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; skillId: string | null }>({
    isOpen: false,
    skillId: null
  });
  const categoryInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    loadSkills();
  }, []);
  /**
   * @description 모든 기술과 카테고리 정보를 불러옵니다.
   * @returns {Promise<void>}
   */
  const loadSkills = async () => {
    try {
      setLoading(true);
      const response = await personalApi.getSkills();
      if (response.success && response.data) {
        setSkills(response.data.skills || []);
        const categoriesData = response.data.categories || [];
        setCategories(categoriesData);
      } else {
        toast.error('기술 스택을 불러올 수 없습니다.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '기술 스택을 불러오는 중 오류가 발생했습니다.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  const handleSaveSkill = async (skillData: Partial<Skill>): Promise<{ success: boolean; message?: string }> => {
    try {
      if (editingSkill) {
        await skillApi.updateSkill(editingSkill.id, skillData);
        await loadSkills();
        return { success: true, message: '기술 스택이 수정되었습니다.' };
      } else {
        await skillApi.createSkill(skillData);
        await loadSkills();
        return { success: true, message: '기술 스택이 추가되었습니다.' };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '기술 스택 저장 중 오류가 발생했습니다.';
      return { success: false, message: errorMessage };
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
      await skillApi.toggleFeatured(skillId, !currentStatus);
      await loadSkills();
      toast.success(!currentStatus ? '기술 스택이 추천 목록에 추가되었습니다!' : '기술 스택이 추천 목록에서 제거되었습니다!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '추천 상태 변경 중 오류가 발생했습니다.';
      toast.error(errorMessage);
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
      await skillApi.deleteSkill(deleteModal.skillId);
      await loadSkills();
      toast.success('기술 스택이 삭제되었습니다.');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '기술 스택 삭제 중 오류가 발생했습니다.';
      toast.error(errorMessage);
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
      if (response.success) {
        const skillsResponse = await api.get<{ skills: Skill[]; categories: Array<{ id: string; name: string }>; skillsByCategory: unknown[] }>('/skills');
        if (skillsResponse.success && skillsResponse.data?.categories) {
          setCategories(skillsResponse.data.categories);
        }
        if (categoryInputRef.current) {
          categoryInputRef.current.value = '';
        }
        toast.success('카테고리가 추가되었습니다.');
      } else {
        toast.error(response.message || '카테고리 추가에 실패했습니다.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '카테고리 추가에 실패했습니다.';
      toast.error(errorMessage);
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
      if (response.success) {
        const skillsResponse = await api.get<{ skills: Skill[]; categories: Array<{ id: string; name: string }>; skillsByCategory: unknown[] }>('/skills');
        if (skillsResponse.success && skillsResponse.data?.categories) {
          setCategories(skillsResponse.data.categories);
        }
        toast.success('카테고리가 삭제되었습니다.');
      } else {
        toast.error(response.message || '카테고리 삭제에 실패했습니다.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '카테고리 삭제에 실패했습니다.';
      toast.error(errorMessage);
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
    if (!isCategoryModalOpen) {
      loadSkills();
    }
  }, [isCategoryModalOpen]);
  if (loading) {
    return (
      <div className="flex-1 p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 dark:bg-slate-700 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-300 dark:bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex-1">
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              기술 스택 관리
            </h1>
            <div className="flex space-x-3">
              <button 
                onClick={() => setIsCategoryModalOpen(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                카테고리 관리
              </button>
              <button 
                onClick={openAddModal}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                새 기술 스택 추가
              </button>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
            <div className="overflow-x-auto">
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
            {skills.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-slate-400">
                  등록된 기술 스택이 없습니다.
                </p>
              </div>
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
