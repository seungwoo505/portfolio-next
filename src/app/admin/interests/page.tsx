"use client";
import { useState, useEffect } from "react";
import { authApi } from "@/lib/api";
import ConfirmModal from '@/components/ConfirmModal';
import toast from 'react-hot-toast';
import { Heart, Plus, Code, Edit, Trash2, X, Save } from 'lucide-react';
import { AdminInterest } from '@/types';
/**
 * @description 관심사를 추가·수정·삭제할 수 있는 관리자 페이지입니다.
 * @returns {JSX.Element} 관심사 관리 페이지 컴포넌트.
 */
export default function InterestsPage() {
  const [interests, setInterests] = useState<AdminInterest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingInterest, setEditingInterest] = useState<AdminInterest | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; interestId: string | null }>({
    isOpen: false,
    interestId: null
  });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'technical' as 'technical' | 'personal',
    display_order: 0
  });
  useEffect(() => {
    fetchInterests();
  }, []);
  /**
   * @description 관심사 목록을 불러옵니다.
   * @returns {Promise<void>}
   */
  const fetchInterests = async () => {
    try {
      const response = await authApi.get<AdminInterest[]>('/admin/interests');
      if (response.data) {
        setInterests(response.data);
      }
    } catch {
      toast.error('관심사를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };
  /**
   * @description 입력값 변경 시 폼 상태를 업데이트합니다.
   * @param {React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>} e 입력 이벤트.
   * @returns {void}
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'display_order' ? parseInt(value) || 0 : value
    }));
  };
  /**
   * @description 관심사 추가/수정 모달을 엽니다.
   * @param {AdminInterest} [interest] 편집할 관심사.
   * @returns {void}
   */
  const openModal = (interest?: AdminInterest) => {
    if (interest) {
      setEditingInterest(interest);
      setFormData({
        title: interest.title,
        description: interest.description || '',
        category: interest.category,
        display_order: interest.display_order
      });
    } else {
      setEditingInterest(null);
      setFormData({
        title: '',
        description: '',
        category: 'technical',
        display_order: interests.length + 1
      });
    }
    setShowModal(true);
  };
  /**
   * @description 관심사 모달을 닫고 입력값을 초기화합니다.
   * @returns {void}
   */
  const closeModal = () => {
    setShowModal(false);
    setEditingInterest(null);
    setFormData({
      title: '',
      description: '',
      category: 'technical',
      display_order: 0
    });
  };
  /**
   * @description 관심사를 저장합니다.
   * @returns {Promise<void>}
   */
  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('제목을 입력해주세요.');
      return;
    }
    setSaving(true);
    try {
      let response;
      if (editingInterest) {
        response = await authApi.put(`/admin/interests/${editingInterest.id}`, formData);
      } else {
        response = await authApi.post('/admin/interests', formData);
      }
      if (response.success) {
        toast.success(editingInterest ? '관심사가 수정되었습니다.' : '관심사가 추가되었습니다.');
        await fetchInterests();
        closeModal();
      } else {
        toast.error(response.message || '저장에 실패했습니다.');
      }
    } catch {
      toast.error('관심사 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };
  /**
   * @description 삭제 확인 모달을 엽니다.
   * @param {string} interestId 삭제할 관심사 ID.
   * @returns {void}
   */
  const openDeleteModal = (interestId: string) => {
    setDeleteModal({ isOpen: true, interestId });
  };
  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, interestId: null });
  };
  /**
   * @description 선택한 관심사를 삭제합니다.
   * @returns {Promise<void>}
   */
  const handleDelete = async () => {
    if (!deleteModal.interestId) return;
    try {
      const response = await authApi.delete(`/admin/interests/${deleteModal.interestId}`);
      if (response.success) {
        toast.success('관심사가 삭제되었습니다.');
        await fetchInterests();
      } else {
        toast.error(response.message || '삭제에 실패했습니다.');
      }
    } catch {
      toast.error('관심사 삭제에 실패했습니다.');
    }
  };
  const technicalInterests = interests.filter(interest => interest.category === 'technical');
  const personalInterests = interests.filter(interest => interest.category === 'personal');
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-lg p-6">
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-6xl mx-auto">
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Heart className="w-8 h-8 text-pink-600 dark:text-pink-400" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                관심사 관리
              </h1>
            </div>
            <button
              onClick={() => openModal()}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-150 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>관심사 추가</span>
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Code className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    기술적 관심사
                  </h2>
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm rounded-full">
                    {technicalInterests.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {technicalInterests.map((interest) => (
                    <div
                      key={interest.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {interest.title}
                          </h3>
                          {interest.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {interest.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openModal(interest)}
                          className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(interest.id)}
                          className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {technicalInterests.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      기술적 관심사가 없습니다.
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Heart className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    개인적 관심사
                  </h2>
                  <span className="px-2 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300 text-sm rounded-full">
                    {personalInterests.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {personalInterests.map((interest) => (
                    <div
                      key={interest.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {interest.title}
                          </h3>
                          {interest.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {interest.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openModal(interest)}
                          className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(interest.id)}
                          className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {personalInterests.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      개인적 관심사가 없습니다.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showModal && (
        <div
          className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50"
          onClick={closeModal}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingInterest ? '관심사 수정' : '관심사 추가'}
                </h3>
                <button
                  type="button"
                  onClick={closeModal}
                  aria-label="닫기"
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-5">
                <div className="space-y-1.5">
                  <label htmlFor="interest-title" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                    제목 *
                  </label>
                  <input
                    id="interest-title"
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    placeholder="예: 웹 성능 최적화"
                    className="w-full px-3 py-2.5 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-slate-400 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="interest-description" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                    설명
                  </label>
                  <textarea
                    id="interest-description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="관심사에 대한 간단한 설명 (선택)"
                    className="w-full px-3 py-2.5 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-slate-400 resize-y min-h-[76px] transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="interest-category" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                    카테고리
                  </label>
                  <select
                    id="interest-category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  >
                    <option value="technical">기술적 관심사</option>
                    <option value="personal">개인적 관심사</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="interest-display-order" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                    표시 순서
                  </label>
                  <input
                    id="interest-display-order"
                    type="number"
                    name="display_order"
                    value={formData.display_order}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-3 py-2.5 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                  <p className="text-xs text-gray-500 dark:text-slate-400">숫자가 작을수록 먼저 표시됩니다.</p>
                </div>
                <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 dark:border-slate-600">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 rounded-lg text-gray-600 dark:text-slate-400 hover:text-gray-800 hover:bg-gray-100 dark:hover:text-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? '저장 중...' : '저장'}</span>
                  </button>
                </div>
              </form>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        title="관심사 삭제"
        message="정말로 이 관심사를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmText="삭제"
        cancelText="취소"
        isDestructive={true}
      />
    </div>
  );
}
