'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { PersonalInfo } from '@/types';
import { ensureApiSuccess, getErrorMessage } from '@/utils/api-response';
import { AdminErrorState } from '../components/AdminState';
/**
 * @description 포트폴리오에 표시될 개인정보를 관리하는 페이지입니다.
 * @returns {JSX.Element} 개인정보 관리 페이지 컴포넌트.
 */
export default function PersonalInfoPage() {
  const { isAuthenticated } = useAdmin();
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    id: '',
    full_name: '',
    name: '',
    title: '',
    bio: '',
    about: '',
    location: '',
    email: '',
    phone: '',
    avatar_url: '',
    resume_url: '',
    github_url: '',
    linkedin_url: '',
    twitter_url: '',
    instagram_url: '',
    updated_at: ''
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  /**
   * @description 개인정보를 서버에서 불러옵니다.
   * @returns {Promise<void>}
   */
  const fetchPersonalInfo = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const response = await authApi.get<PersonalInfo>('/admin/personal-info');
      ensureApiSuccess(response, '개인정보를 불러올 수 없습니다.');
      if (response.data) {
        setPersonalInfo(response.data);
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error, '개인정보를 불러오는데 실패했습니다.');
      setLoadError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    if (isAuthenticated) {
      fetchPersonalInfo();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, fetchPersonalInfo]);
  /**
   * @description 입력값 변경 시 상태를 업데이트합니다.
   * @param {keyof PersonalInfo} field 변경할 필드.
   * @param {string} value 새로운 값.
   * @returns {void}
   */
  const handleInputChange = (field: keyof PersonalInfo, value: string) => {
    setPersonalInfo(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };
  /**
   * @description 변경된 개인정보를 저장합니다.
   * @returns {Promise<void>}
   */
  const handleSave = async () => {
    if (!hasChanges) {
      toast('변경된 내용이 없습니다.', {
        duration: 2000,
        icon: 'ℹ️',
      });
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { ...personalInfo };
      const response = await authApi.put<PersonalInfo>('/admin/personal-info', payload);
      ensureApiSuccess(response, '개인정보 저장에 실패했습니다.');
      toast.success('개인정보가 성공적으로 저장되었습니다!', {
        duration: 3000,
        icon: '✅',
      });
      setHasChanges(false);
      if (response.data) {
        setPersonalInfo(response.data);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, '개인정보 저장 중 오류가 발생했습니다.'), {
        duration: 4000,
        icon: '⚠️',
      });
    } finally {
      setSaving(false);
    }
  };
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  if (loadError) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <AdminErrorState
          title="개인정보를 불러오지 못했습니다"
          description={loadError}
          onRetry={fetchPersonalInfo}
        />
      </div>
    );
  }
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                개인정보 관리
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                포트폴리오에 표시될 개인정보를 관리합니다.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {hasChanges && (
                <span className="text-sm text-orange-600 dark:text-orange-400">
                  저장되지 않은 변경사항이 있습니다
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  hasChanges && !saving
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
        <div className="px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                기본 정보
              </h3>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  이름 (full_name)
                </label>
                <input
                  type="text"
                  value={personalInfo.full_name || ''}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="예: 홍길동"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  이름 (name) - 백업용
                </label>
                <input
                  type="text"
                  value={personalInfo.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="예: 홍길동"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  직책/타이틀
                </label>
                <input
                  type="text"
                  value={personalInfo.title || ''}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="예: 프론트엔드 개발자"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  짧은 소개 (bio)
                </label>
                <textarea
                  value={personalInfo.bio || ''}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="메인 페이지에 표시될 짧은 소개"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  상세 소개 (about)
                </label>
                <textarea
                  value={personalInfo.about || ''}
                  onChange={(e) => handleInputChange('about', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="About 페이지에 표시될 상세 소개"
                />
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                연락처 정보
              </h3>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  이메일
                </label>
                <input
                  type="email"
                  value={personalInfo.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="example@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  전화번호
                </label>
                <input
                  type="tel"
                  value={personalInfo.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="010-1234-5678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  위치
                </label>
                <input
                  type="text"
                  value={personalInfo.location || ''}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="예: 서울, 대한민국"
                />
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  소셜 미디어
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      GitHub URL
                    </label>
                    <input
                      type="url"
                      value={personalInfo.github_url || ''}
                      onChange={(e) => handleInputChange('github_url', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      placeholder="https://github.com/username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      LinkedIn URL
                    </label>
                    <input
                      type="url"
                      value={personalInfo.linkedin_url || ''}
                      onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Twitter URL
                    </label>
                    <input
                      type="url"
                      value={personalInfo.twitter_url || ''}
                      onChange={(e) => handleInputChange('twitter_url', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      placeholder="https://twitter.com/username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Instagram URL
                    </label>
                    <input
                      type="url"
                      value={personalInfo.instagram_url || ''}
                      onChange={(e) => handleInputChange('instagram_url', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      placeholder="https://instagram.com/username"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  기타 URL
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      프로필 이미지 URL
                    </label>
                    <input
                      type="url"
                      value={personalInfo.avatar_url || ''}
                      onChange={(e) => handleInputChange('avatar_url', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      placeholder="https://example.com/profile.jpg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      이력서 URL
                    </label>
                    <input
                      type="url"
                      value={personalInfo.resume_url || ''}
                      onChange={(e) => handleInputChange('resume_url', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      placeholder="https://example.com/resume.pdf"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          {personalInfo.updated_at && (
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                <p>마지막 수정: {new Date(personalInfo.updated_at).toLocaleString('ko-KR')}</p>
                <p>ID: {personalInfo.id}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
