"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { authApi } from "@/lib/api";
import ConfirmModal from '@/components/ConfirmModal';
import toast from 'react-hot-toast';
import { Briefcase, Plus, Calendar, Edit, Trash2, X, Save } from 'lucide-react';

interface Experience {
  id: string;
  title: string;
  company?: string;
  start_date?: string;
  end_date?: string | null;
  description?: string;
  achievements?: string[];
  created_at: string;
  updated_at: string;
}

export default function ExperiencesPage() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; experienceId: string | null }>({
    isOpen: false,
    experienceId: null
  });

  // 폼 데이터
  const [formData, setFormData] = useState({
    type: 'work',
    title: '',
    company: '',
    start_date: '',
    end_date: '',
    description: '',
    achievements: ''
  });

  // 데이터 로드
  useEffect(() => {
    fetchExperiences();
  }, []);

  const fetchExperiences = async () => {
    try {
      const response = await authApi.get<Experience[]>('/experiences');
      if (response.data) {
        setExperiences(response.data);
      }
    } catch {
      toast.error('경험을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const openModal = (experience?: Experience) => {
    if (experience) {
      setEditingExperience(experience);
      setFormData({
        type: (experience as Experience & { type?: string }).type || 'work',
        title: experience.title,
        company: experience.company || '',
        start_date: experience.start_date ? experience.start_date.split('T')[0] : '',
        end_date: experience.end_date ? experience.end_date.split('T')[0] : '',
        description: experience.description || '',
        achievements: experience.achievements ? experience.achievements.join('\n') : ''
      });
    } else {
      setEditingExperience(null);
      setFormData({
        type: 'work',
        title: '',
        company: '',
        start_date: '',
        end_date: '',
        description: '',
        achievements: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingExperience(null);
    setFormData({
      type: 'work',
      title: '',
      company: '',
      start_date: '',
      end_date: '',
      description: '',
      achievements: ''
    });
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('제목을 입력해주세요.');
      return;
    }

    setSaving(true);

    try {
      const achievements = formData.achievements
        .split('\n')
        .map(achievement => achievement.trim())
        .filter(achievement => achievement.length > 0);

      const data = {
        ...formData,
        achievements: achievements.length > 0 ? achievements : undefined,
        end_date: formData.end_date || null
      };

      let response;
      if (editingExperience) {
        response = await authApi.put(`/experiences/${editingExperience.id}`, data);
      } else {
        response = await authApi.post('/experiences', data);
      }

      if (response.success) {
        toast.success(editingExperience ? '경험이 수정되었습니다.' : '경험이 추가되었습니다.');
        await fetchExperiences();
        
        // 저장 성공 시 모달 닫기
        closeModal();
      } else {
        toast.error(response.message || '저장에 실패했습니다.');
      }
    } catch {
      toast.error('경험 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 경험 삭제 모달 열기
  const openDeleteModal = (experienceId: string) => {
    setDeleteModal({ isOpen: true, experienceId });
  };

  // 경험 삭제 모달 닫기
  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, experienceId: null });
  };

  // 경험 삭제 실행
  const handleDelete = async () => {
    if (!deleteModal.experienceId) return;
    
    try {
      const response = await authApi.delete(`/experiences/${deleteModal.experienceId}`);
      if (response.success) {
        toast.success('경험이 삭제되었습니다.');
        await fetchExperiences();
      } else {
        toast.error(response.message || '삭제에 실패했습니다.');
      }
    } catch {
      toast.error('경험 삭제에 실패했습니다.');
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '현재';
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
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
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Briefcase className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                경험 관리
              </h1>
            </div>
            <motion.button
              onClick={() => openModal()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>경험 추가</span>
            </motion.button>
          </div>


          {/* 경험 목록 */}
          <div className="space-y-4">
            {experiences.map((experience, index) => (
              <motion.div
                key={experience.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {experience.title}
                      </h3>
                      {experience.company && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm rounded-full">
                          {experience.company}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {formatDate(experience.start_date)} - {formatDate(experience.end_date)}
                        </span>
                      </div>
                    </div>
                    
                    {experience.description && (
                      <p className="text-gray-700 dark:text-gray-300 mb-3">
                        {experience.description}
                      </p>
                    )}
                    
                    {experience.achievements && experience.achievements.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                          주요 성과:
                        </h4>
                        <ul className="space-y-1">
                          {experience.achievements.map((achievement, achievementIndex) => (
                            <li key={achievementIndex} className="text-sm text-gray-600 dark:text-gray-400 flex items-start space-x-2">
                              <span className="text-blue-500 mt-1">•</span>
                              <span>{achievement}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => openModal(experience)}
                      className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openDeleteModal(experience.id)}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {experiences.length === 0 && (
              <div className="text-center py-12">
                <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  경험이 없습니다
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  첫 번째 경험을 추가해보세요.
                </p>
                <motion.button
                  onClick={() => openModal()}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>경험 추가</span>
                </motion.button>
              </div>
            )}
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
              className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingExperience ? '경험 수정' : '경험 추가'}
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
                    타입 *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  >
                    <option value="work">직장 경험</option>
                    <option value="education">교육</option>
                    <option value="project">프로젝트</option>
                    <option value="volunteer">봉사활동</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      직책/제목 *
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
                      회사/기관
                    </label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      시작일
                    </label>
                    <input
                      type="date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      종료일 (현재 재직 중이면 비워두세요)
                    </label>
                    <input
                      type="date"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    />
                  </div>
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    주요 성과 (한 줄에 하나씩)
                  </label>
                  <textarea
                    name="achievements"
                    value={formData.achievements}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="• 프로젝트 성과 1&#10;• 프로젝트 성과 2&#10;• 프로젝트 성과 3"
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
        title="경험 삭제"
        message="정말로 이 경험을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmText="삭제"
        cancelText="취소"
        isDestructive={true}
      />
    </div>
  );
}
