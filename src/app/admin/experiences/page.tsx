"use client";
import { useState, useEffect } from "react";
import { authApi } from "@/lib/api";
import ConfirmModal from '@/components/ConfirmModal';
import toast from 'react-hot-toast';
import { Briefcase, Plus, Calendar, Edit, Trash2, X, Save } from 'lucide-react';
import { AdminExperience } from '@/types';
/**
 * @description 경력 및 활동 정보를 관리하는 관리자 페이지입니다.
 * @returns {JSX.Element} 경력 관리 페이지 컴포넌트.
 */
export default function ExperiencesPage() {
  const [experiences, setExperiences] = useState<AdminExperience[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingExperience, setEditingExperience] = useState<AdminExperience | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; experienceId: string | null }>({
    isOpen: false,
    experienceId: null
  });
  const [formData, setFormData] = useState({
    type: 'work',
    title: '',
    company: '',
    start_date: '',
    end_date: '',
    description: '',
    achievements: ''
  });
  useEffect(() => {
    fetchExperiences();
  }, []);
  /**
   * @description 경험 목록을 불러옵니다.
   * @returns {Promise<void>}
   */
  const fetchExperiences = async () => {
    try {
      const response = await authApi.get<AdminExperience[]>('/admin/experiences/timeline');
      if (response.data) {
        setExperiences(response.data);
      }
    } catch {
      toast.error('경험을 불러오는데 실패했습니다.');
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
      [name]: value
    }));
  };
  /**
   * @description 경험 추가/수정 모달을 엽니다.
   * @param {AdminExperience} [experience] 편집할 경험.
   * @returns {void}
   */
  const openModal = (experience?: AdminExperience) => {
    if (experience) {
      setEditingExperience(experience);
      setFormData({
        type: (experience as AdminExperience & { type?: string }).type || 'work',
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
  /**
   * @description 경험 모달을 닫고 입력값을 초기화합니다.
   * @returns {void}
   */
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
  /**
   * @description 경험 정보를 저장합니다.
   * @returns {Promise<void>}
   */
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
        response = await authApi.put(`/admin/experiences/${editingExperience.id}`, data);
      } else {
        response = await authApi.post('/admin/experiences', data);
      }
      if (response.success) {
        toast.success(editingExperience ? '경험이 수정되었습니다.' : '경험이 추가되었습니다.');
        await fetchExperiences();
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
  /**
   * @description 삭제 확인 모달을 엽니다.
   * @param {string} experienceId 삭제할 경험 ID.
   * @returns {void}
   */
  const openDeleteModal = (experienceId: string) => {
    setDeleteModal({ isOpen: true, experienceId });
  };
  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, experienceId: null });
  };
  /**
   * @description 선택한 경험을 삭제합니다.
   * @returns {Promise<void>}
   */
  const handleDelete = async () => {
    if (!deleteModal.experienceId) return;
    try {
      const response = await authApi.delete(`/admin/experiences/${deleteModal.experienceId}`);
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
  /**
   * @description 날짜 문자열을 `YYYY.MM` 형식으로 변환합니다.
   * @param {string | null | undefined} dateString 날짜 문자열.
   * @returns {string} 변환된 날짜 문자열 또는 '현재'.
   */
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
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Briefcase className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                경험 관리
              </h1>
            </div>
            <button
              onClick={() => openModal()}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-150 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>경험 추가</span>
            </button>
          </div>
          <div className="space-y-4">
            {experiences.map((experience) => (
              <div
                key={experience.id}
                className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 transition-colors"
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
              </div>
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
                <button
                  onClick={() => openModal()}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-150 hover:scale-[1.02] active:scale-[0.98] mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>경험 추가</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {showModal && (
        <div
          className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50"
          onClick={closeModal}
        >
          <div
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
              <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-5">
                <div className="space-y-1.5">
                  <label htmlFor="exp-type" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                    타입 *
                  </label>
                  <select
                    id="exp-type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2.5 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  >
                    <option value="work">직장 경험</option>
                    <option value="education">교육</option>
                    <option value="project">프로젝트</option>
                    <option value="volunteer">봉사활동</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="exp-title" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                      직책/제목 *
                    </label>
                    <input
                      id="exp-title"
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      placeholder="예: 프론트엔드 개발자"
                      className="w-full px-3 py-2.5 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-slate-400 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="exp-company" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                      회사/기관
                    </label>
                    <input
                      id="exp-company"
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      placeholder="예: (주)회사명"
                      className="w-full px-3 py-2.5 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-slate-400 transition-colors"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="exp-start" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                      시작일
                    </label>
                    <input
                      id="exp-start"
                      type="date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors [color-scheme:light] dark:[color-scheme:dark]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="exp-end" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                      종료일
                    </label>
                    <input
                      id="exp-end"
                      type="date"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors [color-scheme:light] dark:[color-scheme:dark]"
                    />
                    <p className="text-xs text-gray-500 dark:text-slate-400">재직 중이면 비워두세요</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="exp-desc" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                    설명
                  </label>
                  <textarea
                    id="exp-desc"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="경험에 대한 간단한 설명을 입력하세요."
                    className="w-full px-3 py-2.5 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-slate-400 resize-y min-h-[76px] transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="exp-achievements" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                    주요 성과
                  </label>
                  <textarea
                    id="exp-achievements"
                    name="achievements"
                    value={formData.achievements}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="한 줄에 하나씩 입력하세요. (예: 프로젝트 성과 1)"
                    className="w-full px-3 py-2.5 text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-slate-400 resize-y min-h-[100px] transition-colors"
                  />
                  <p className="text-xs text-gray-500 dark:text-slate-400">줄바꿈으로 구분해 입력하면 목록으로 저장됩니다.</p>
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
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100"
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
        title="경험 삭제"
        message="정말로 이 경험을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmText="삭제"
        cancelText="취소"
        isDestructive={true}
      />
    </div>
  );
}
