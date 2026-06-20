'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { AdminSettingEntry, AdminSettingsMap } from '@/types';
import { ensureApiSuccess, getErrorMessage } from '@/utils/api-response';
import { AdminErrorState } from '../components/AdminState';
/**
 * @description 사이트 전역 설정을 관리하는 관리자 페이지입니다.
 * @returns {JSX.Element} 설정 관리 페이지 컴포넌트.
 */
export default function SettingsPage() {
  const { isAuthenticated } = useAdmin();
  const [settings, setSettings] = useState<AdminSettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [changedSettings, setChangedSettings] = useState<{ [key: string]: string | number | boolean | Record<string, unknown> }>({});
  const getDefaultSettings = (): AdminSettingsMap => {
    return {
      site_title: {
        value: '승우.dev',
        type: 'string',
        is_public: true,
        description: '사이트 제목',
        updated_at: new Date().toISOString()
      },
      site_description: {
        value: '풀스택 개발자 승우의 포트폴리오',
        type: 'string',
        is_public: true,
        description: '사이트 설명',
        updated_at: new Date().toISOString()
      },
      site_logo: {
        value: '',
        type: 'string',
        is_public: true,
        description: '사이트 로고 URL',
        updated_at: new Date().toISOString()
      },
      favicon: {
        value: '',
        type: 'string',
        is_public: true,
        description: '파비콘 URL',
        updated_at: new Date().toISOString()
      },
      meta_keywords: {
        value: '개발자, 포트폴리오, 웹개발, 풀스택',
        type: 'string',
        is_public: true,
        description: '메타 키워드',
        updated_at: new Date().toISOString()
      },
      meta_author: {
        value: '승우',
        type: 'string',
        is_public: true,
        description: '메타 작성자',
        updated_at: new Date().toISOString()
      },
      seo_title: {
        value: '승우의 포트폴리오 | 프론트엔드 개발자',
        type: 'string',
        is_public: true,
        description: 'SEO 페이지 제목',
        updated_at: new Date().toISOString()
      },
      seo_description: {
        value: '프론트엔드 개발자 승우의 포트폴리오입니다. React, Next.js, TypeScript를 활용한 웹 개발 프로젝트와 기술 블로그를 확인해보세요.',
        type: 'string',
        is_public: true,
        description: 'SEO 메타 설명',
        updated_at: new Date().toISOString()
      },
      og_title: {
        value: '승우의 포트폴리오 | 프론트엔드 개발자',
        type: 'string',
        is_public: true,
        description: 'Open Graph 제목',
        updated_at: new Date().toISOString()
      },
      og_description: {
        value: '프론트엔드 개발자 승우의 포트폴리오입니다. React, Next.js, TypeScript를 활용한 웹 개발 프로젝트와 기술 블로그를 확인해보세요.',
        type: 'string',
        is_public: true,
        description: 'Open Graph 설명',
        updated_at: new Date().toISOString()
      },
      og_image: {
        value: 'https://seungwoo.i234.me/og-image.svg',
        type: 'string',
        is_public: true,
        description: 'Open Graph 이미지 URL',
        updated_at: new Date().toISOString()
      },
      og_alt: {
        value: '승우의 포트폴리오',
        type: 'string',
        is_public: true,
        description: 'Open Graph 이미지 대체 텍스트',
        updated_at: new Date().toISOString()
      },
      twitter_title: {
        value: '승우의 포트폴리오 | 프론트엔드 개발자',
        type: 'string',
        is_public: true,
        description: 'Twitter 카드 제목',
        updated_at: new Date().toISOString()
      },
      twitter_description: {
        value: '프론트엔드 개발자 승우의 포트폴리오입니다. React, Next.js, TypeScript를 활용한 웹 개발 프로젝트와 기술 블로그를 확인해보세요.',
        type: 'string',
        is_public: true,
        description: 'Twitter 카드 설명',
        updated_at: new Date().toISOString()
      },
      twitter_username: {
        value: '@seungwoo',
        type: 'string',
        is_public: true,
        description: 'Twitter 사용자명',
        updated_at: new Date().toISOString()
      },
      google_verification: {
        value: 'Vl181oV3jRYtolyEhTMDgGAlcusVl2qWA71k43xV_YQ',
        type: 'string',
        is_public: true,
        description: 'Google Search Console 인증 코드',
        updated_at: new Date().toISOString()
      },
      robots_index: {
        value: 'true',
        type: 'string',
        is_public: true,
        description: '검색엔진 인덱싱 허용',
        updated_at: new Date().toISOString()
      },
      robots_follow: {
        value: 'true',
        type: 'string',
        is_public: true,
        description: '검색엔진 링크 팔로우 허용',
        updated_at: new Date().toISOString()
      },
      canonical_url: {
        value: 'https://seungwoo.i234.me',
        type: 'string',
        is_public: true,
        description: '정규 URL (Canonical URL)',
        updated_at: new Date().toISOString()
      },
      contact_email: {
        value: 'seungwoo@example.com',
        type: 'string',
        is_public: true,
        description: '연락처 이메일',
        updated_at: new Date().toISOString()
      },
      business_hours: {
        value: '평일 9:00-18:00',
        type: 'string',
        is_public: true,
        description: '업무 시간',
        updated_at: new Date().toISOString()
      },
      github_url: {
        value: '',
        type: 'string',
        is_public: true,
        description: 'GitHub URL',
        updated_at: new Date().toISOString()
      },
      linkedin_url: {
        value: '',
        type: 'string',
        is_public: true,
        description: 'LinkedIn URL',
        updated_at: new Date().toISOString()
      },
      social_twitter: {
        value: '',
        type: 'string',
        is_public: true,
        description: 'Twitter URL',
        updated_at: new Date().toISOString()
      },
      social_instagram: {
        value: '',
        type: 'string',
        is_public: true,
        description: 'Instagram URL',
        updated_at: new Date().toISOString()
      },
      enable_blog: {
        value: true,
        type: 'boolean',
        is_public: true,
        description: '블로그 기능 활성화',
        updated_at: new Date().toISOString()
      },
      enable_projects: {
        value: true,
        type: 'boolean',
        is_public: true,
        description: '프로젝트 기능 활성화',
        updated_at: new Date().toISOString()
      },
      enable_contact_form: {
        value: true,
        type: 'boolean',
        is_public: true,
        description: '연락처 폼 활성화',
        updated_at: new Date().toISOString()
      },
      enable_comments: {
        value: false,
        type: 'boolean',
        is_public: true,
        description: '댓글 기능 활성화',
        updated_at: new Date().toISOString()
      },
      maintenance_mode: {
        value: false,
        type: 'boolean',
        is_public: false,
        description: '유지보수 모드',
        updated_at: new Date().toISOString()
      },
      primary_color: {
        value: '#3b82f6',
        type: 'string',
        is_public: true,
        description: '주 색상',
        updated_at: new Date().toISOString()
      },
      secondary_color: {
        value: '#8b5cf6',
        type: 'string',
        is_public: true,
        description: '보조 색상',
        updated_at: new Date().toISOString()
      },
      font_family: {
        value: 'Inter',
        type: 'string',
        is_public: true,
        description: '폰트 패밀리',
        updated_at: new Date().toISOString()
      },
      dark_mode: {
        value: true,
        type: 'boolean',
        is_public: true,
        description: '다크 모드 기본값',
        updated_at: new Date().toISOString()
      },
      show_animations: {
        value: true,
        type: 'boolean',
        is_public: true,
        description: '애니메이션 표시',
        updated_at: new Date().toISOString()
      },
      posts_per_page: {
        value: 10,
        type: 'number',
        is_public: true,
        description: '페이지당 포스트 수',
        updated_at: new Date().toISOString()
      },
      projects_per_page: {
        value: 12,
        type: 'number',
        is_public: true,
        description: '페이지당 프로젝트 수',
        updated_at: new Date().toISOString()
      },
      enable_search: {
        value: true,
        type: 'boolean',
        is_public: true,
        description: '검색 기능 활성화',
        updated_at: new Date().toISOString()
      },
      enable_rss: {
        value: true,
        type: 'boolean',
        is_public: true,
        description: 'RSS 피드 활성화',
        updated_at: new Date().toISOString()
      },
      contact_form_name_placeholder: {
        value: '홍길동',
        type: 'string',
        is_public: true,
        description: '연락처 폼 이름 입력 필드 플레이스홀더',
        updated_at: new Date().toISOString()
      },
      contact_form_email_placeholder: {
        value: 'hello@example.com',
        type: 'string',
        is_public: true,
        description: '연락처 폼 이메일 입력 필드 플레이스홀더',
        updated_at: new Date().toISOString()
      },
      contact_form_subject_placeholder: {
        value: '문의 제목을 입력하세요',
        type: 'string',
        is_public: true,
        description: '연락처 폼 제목 입력 필드 플레이스홀더',
        updated_at: new Date().toISOString()
      },
      contact_form_message_placeholder: {
        value: '문의 내용을 입력하세요',
        type: 'string',
        is_public: true,
        description: '연락처 폼 메시지 입력 필드 플레이스홀더',
        updated_at: new Date().toISOString()
      },
      contact_form_submit_text: {
        value: '메시지 보내기',
        type: 'string',
        is_public: true,
        description: '연락처 폼 전송 버튼 텍스트',
        updated_at: new Date().toISOString()
      },
      contact_form_success_message: {
        value: '메시지가 성공적으로 전송되었습니다!',
        type: 'string',
        is_public: true,
        description: '연락처 폼 전송 성공 메시지',
        updated_at: new Date().toISOString()
      },
      contact_form_error_message: {
        value: '메시지 전송에 실패했습니다. 다시 시도해주세요.',
        type: 'string',
        is_public: true,
        description: '연락처 폼 전송 실패 메시지',
        updated_at: new Date().toISOString()
      },
      personal_name: {
        value: '승우',
        type: 'string',
        is_public: true,
        description: '사이트 소개 이름',
        updated_at: new Date().toISOString()
      },
      personal_title: {
        value: '웹 프론트엔드 개발자',
        type: 'string',
        is_public: true,
        description: '사이트 소개 직책/타이틀',
        updated_at: new Date().toISOString()
      },
      personal_bio: {
        value: '안녕하세요! 웹 개발자 승우입니다.',
        type: 'string',
        is_public: true,
        description: '사이트 소개 짧은 소개',
        updated_at: new Date().toISOString()
      },
      personal_about: {
        value: '상세한 소개 내용을 여기에 입력하세요.',
        type: 'string',
        is_public: true,
        description: '사이트 소개 상세 소개',
        updated_at: new Date().toISOString()
      },
      personal_location: {
        value: '서울, 대한민국',
        type: 'string',
        is_public: true,
        description: '사이트 소개 위치',
        updated_at: new Date().toISOString()
      },
      personal_email: {
        value: 'seungwoo@example.com',
        type: 'string',
        is_public: true,
        description: '사이트 소개 이메일',
        updated_at: new Date().toISOString()
      },
      personal_phone: {
        value: '',
        type: 'string',
        is_public: false,
        description: '사이트 소개 전화번호',
        updated_at: new Date().toISOString()
      },
      personal_avatar_url: {
        value: '',
        type: 'string',
        is_public: true,
        description: '사이트 소개 프로필 이미지 URL',
        updated_at: new Date().toISOString()
      },
      personal_resume_url: {
        value: '',
        type: 'string',
        is_public: true,
        description: '사이트 소개 이력서 URL',
        updated_at: new Date().toISOString()
      },
      personal_github_url: {
        value: '',
        type: 'string',
        is_public: true,
        description: '사이트 소개 GitHub URL',
        updated_at: new Date().toISOString()
      },
      personal_linkedin_url: {
        value: '',
        type: 'string',
        is_public: true,
        description: '사이트 소개 LinkedIn URL',
        updated_at: new Date().toISOString()
      },
      personal_twitter_url: {
        value: '',
        type: 'string',
        is_public: true,
        description: '사이트 소개 Twitter URL',
        updated_at: new Date().toISOString()
      },
      personal_instagram_url: {
        value: '',
        type: 'string',
        is_public: true,
        description: '사이트 소개 Instagram URL',
        updated_at: new Date().toISOString()
      }
    };
  };
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const response = await authApi.get<AdminSettingsMap>('/admin/settings');
      ensureApiSuccess(response, '설정을 불러오는데 실패했습니다.');
      if (response.data && Object.keys(response.data).length > 0) {
        const defaultSettings = getDefaultSettings();
        const mergedSettings = { ...defaultSettings, ...response.data };
        setSettings(mergedSettings);
      } else {
        setSettings(getDefaultSettings());
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error, '설정을 불러오는데 실패했습니다.');
      setLoadError(errorMessage);
      setSettings({});
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    if (isAuthenticated) {
      fetchSettings();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, fetchSettings]);
  /**
   * @description 설정 값 변경을 반영하고 수정 상태를 기록합니다.
   * @param {string} key 설정 키.
   * @param {string | number | boolean | Record<string, unknown>} value 변경할 값.
   * @returns {void}
   */
  const handleSettingChange = (key: string, value: string | number | boolean | Record<string, unknown>) => {
    setSettings(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        value: value
      }
    }));
    setChangedSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  /**
   * @description 변경된 설정을 서버에 저장합니다.
   * @returns {Promise<void>}
   */
  const handleSave = async () => {
    if (Object.keys(changedSettings).length === 0) {
      toast('변경된 설정이 없습니다.');
      return;
    }
    setSaving(true);
    try {
      const settingsToUpdate: { [key: string]: { value: string | number | boolean | Record<string, unknown>; type: string; is_public: boolean; description: string } } = {};
      Object.entries(changedSettings).forEach(([key]) => {
        const setting = settings?.[key];
        if (setting) {
          settingsToUpdate[key] = {
            value: setting.value,
            type: setting.type,
            is_public: setting.is_public,
            description: setting.description
          };
        }
      });
      const response = await authApi.put('/admin/settings', { settings: settingsToUpdate });
      ensureApiSuccess(response, '설정 저장에 실패했습니다.');
      toast.success(`${Object.keys(changedSettings).length}개 설정이 성공적으로 저장되었습니다!`, {
        duration: 3000,
        icon: '⚙️',
      });
      setChangedSettings({}); 
    } catch (error) {
      toast.error(getErrorMessage(error, '설정 저장에 실패했습니다.'), {
        duration: 4000,
        icon: '❌',
      });
    } finally {
      setSaving(false);
    }
  };
  /**
   * @description 설정 타입에 맞는 입력 컴포넌트를 렌더링합니다.
   * @param {string} key 설정 키.
   * @param {AdminSettingEntry} setting 설정 값.
   * @returns {JSX.Element} 렌더링된 입력 요소.
   */
  const renderSettingInput = (key: string, setting: AdminSettingEntry) => {
    const { type } = setting;
    switch (type) {
      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={setting.value === true}
            onChange={(e) => handleSettingChange(key, e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded focus:ring-blue-500"
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={typeof setting.value === 'number' ? setting.value : Number(setting.value) || 0}
            onChange={(e) => handleSettingChange(key, Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          />
        );
      case 'json':
        return (
          <textarea
            value={typeof setting.value === 'string' ? setting.value : JSON.stringify(setting.value, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleSettingChange(key, parsed);
              } catch {
                handleSettingChange(key, e.target.value);
              }
            }}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            placeholder="JSON 형식으로 입력하세요"
          />
        );
      default: 
        return (
          <input
            type="text"
            value={typeof setting.value === 'string' ? setting.value : String(setting.value) || ''}
            onChange={(e) => handleSettingChange(key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          />
        );
    }
  };
  /**
   * @description 탭별로 표시할 설정 목록을 반환합니다.
   * @param {string} tabName 탭 이름.
   * @returns {{ [key: string]: AdminSettingEntry }} 탭에 해당하는 설정 객체.
   */
  const getTabSettings = (tabName: string) => {
    const tabGroups: { [key: string]: string[] } = {
      general: ['site_title', 'site_description', 'site_logo', 'favicon'],
      seo: ['meta_keywords', 'meta_author', 'seo_title', 'seo_description', 'og_title', 'og_description', 'og_image', 'og_alt', 'twitter_title', 'twitter_description', 'twitter_username', 'google_verification', 'robots_index', 'robots_follow', 'canonical_url'],
      contact: ['contact_email', 'contact_phone', 'contact_address', 'business_hours', 'contact_form_name_placeholder', 'contact_form_email_placeholder', 'contact_form_subject_placeholder', 'contact_form_message_placeholder', 'contact_form_submit_text', 'contact_form_success_message', 'contact_form_error_message'],
      social: ['github_url', 'linkedin_url', 'social_twitter', 'social_instagram'],
      features: ['enable_blog', 'enable_projects', 'enable_contact_form', 'enable_comments', 'maintenance_mode'],
      design: ['primary_color', 'secondary_color', 'font_family', 'dark_mode', 'show_animations'],
      security: ['max_login_attempts', 'session_timeout', 'enable_2fa', 'allowed_file_types'],
      other: ['posts_per_page', 'projects_per_page', 'enable_search', 'enable_rss']
    };
    const tabSettings: { [key: string]: AdminSettingEntry } = {};
    const keys = tabGroups[tabName] || [];
    keys.forEach(key => {
      if (settings?.[key]) {
        tabSettings[key] = settings[key];
      }
    });
    return tabSettings;
  };
  /**
   * @description 탭 이름에 해당하는 한국어 제목을 반환합니다.
   * @param {string} tabName 탭 이름.
   * @returns {string} 탭 제목.
   */
  const getTabTitle = (tabName: string) => {
    const titles: { [key: string]: string } = {
      general: '사이트 기본',
      seo: 'SEO 및 메타',
      contact: '연락처',
      social: '소셜 미디어',
      features: '기능 설정',
      design: '디자인',
      security: '보안',
      other: '기타'
    };
    return titles[tabName] || tabName;
  };
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">접근 권한이 없습니다</h1>
          <p className="text-gray-600 dark:text-gray-400">로그인이 필요합니다.</p>
        </div>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">설정을 불러오는 중...</p>
        </div>
      </div>
    );
  }
  if (loadError) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AdminErrorState
            title="설정을 불러오지 못했습니다"
            description={loadError}
            onRetry={fetchSettings}
          />
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">사이트 설정</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">사이트의 다양한 설정을 관리할 수 있습니다.</p>
          </div>
          <div className="border-b border-gray-200 dark:border-slate-700">
            <nav className="-mb-px flex space-x-8 px-6">
              {['general', 'seo', 'contact', 'social', 'features', 'design', 'security', 'other'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-slate-600'
                  }`}
                >
                  {getTabTitle(tab)}
                </button>
              ))}
            </nav>
          </div>
          <div className="p-6">
            {(() => {
              const currentSettings = getTabSettings(activeTab);
              if (Object.keys(currentSettings).length === 0) {
                return (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    이 탭에는 설정이 없습니다.
                  </div>
                );
              }
              return (
                <div className="space-y-4">
                  {Object.entries(currentSettings).map(([key, setting]) => (
                    <div key={key} className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {setting.description || key}
                          </label>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            Boolean(setting.is_public)
                              ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300' 
                              : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                          }`}>
                            {Boolean(setting.is_public) ? '공개' : '비공개'}
                          </span>
                          {changedSettings[key] !== undefined && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300">
                              변경됨
                            </span>
                          )}
                        </div>
                        {renderSettingInput(key, setting)}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-slate-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {Object.keys(changedSettings).length > 0 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300">
                    {Object.keys(changedSettings).length}개 설정 변경됨
                  </span>
                )}
              </div>
              <button
                onClick={handleSave}
                disabled={saving || Object.keys(changedSettings).length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {saving ? '저장 중...' : '설정 저장'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
