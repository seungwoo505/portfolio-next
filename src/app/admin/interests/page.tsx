"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { authApi } from "@/lib/api";
import ConfirmModal from '@/components/ConfirmModal';
import toast from 'react-hot-toast';
import { Heart, Plus, Code, Edit, Trash2, X, Save } from 'lucide-react';

interface Interest {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  category: 'technical' | 'personal';
  display_order: number;
  created_at: string;
  updated_at: string;
}

export default function InterestsPage() {
  const [interests, setInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingInterest, setEditingInterest] = useState<Interest | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; interestId: string | null }>({
    isOpen: false,
    interestId: null
  });

  // 폼 데이터
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'technical' as 'technical' | 'personal',
    display_order: 0
  });

  // 데이터 로드
  useEffect(() => {
    fetchInterests();
  }, []);

  const fetchInterests = async () => {
    try {
      const response = await authApi.get<Interest[]>('/interests');
      if (response.data) {
        setInterests(response.data);
      }
    } catch {
      toast.error('관심사를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'display_order' ? parseInt(value) || 0 : value
    }));
  };

  const openModal = (interest?: Interest) => {
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

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('제목을 입력해주세요.');
      return;
    }

    setSaving(true);

    try {
      let response;
      if (editingInterest) {
        response = await authApi.put(`/interests/${editingInterest.id}`, formData);
      } else {
        response = await authApi.post('/interests', formData);
      }

      if (response.success) {
        toast.success(editingInterest ? '관심사가 수정되었습니다.' : '관심사가 추가되었습니다.');
        await fetchInterests();
        
        // 저장 성공 시 모달 닫기
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

  // 관심사 삭제 모달 열기
  const openDeleteModal = (interestId: string) => {
    setDeleteModal({ isOpen: true, interestId });
  };

  // 관심사 삭제 모달 닫기
  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, interestId: null });
  };

  // 관심사 삭제 실행
  const handleDelete = async () => {
    if (!deleteModal.interestId) return;
    
    try {
      const response = await authApi.delete(`/interests/${deleteModal.interestId}`);
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Heart className="w-8 h-8 text-pink-600 dark:text-pink-400" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                관심사 관리
              </h1>
            </div>
            <motion.button
              onClick={() => openModal()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>관심사 추가</span>
            </motion.button>
          </div>


          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 기술적 관심사 */}
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
                    <motion.div
                      key={interest.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg"
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
                    </motion.div>
                  ))}
                  
                  {technicalInterests.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      기술적 관심사가 없습니다.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 개인적 관심사 */}
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
                    <motion.div
                      key={interest.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg"
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
                    </motion.div>
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
        </motion.div>
      </div>

      {/* 모달 */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingInterest ? '관심사 수정' : '관심사 추가'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    제목 *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    설명
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  />
                </div>



                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    카테고리
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  >
                    <option value="technical">기술적 관심사</option>
                    <option value="personal">개인적 관심사</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    표시 순서
                  </label>
                  <input
                    type="number"
                    name="display_order"
                    value={formData.display_order}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    취소
                  </button>
                  <motion.button
                    type="submit"
                    disabled={saving}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? '저장 중...' : '저장'}</span>
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 삭제 확인 모달 */}
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
