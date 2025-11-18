'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface PublicSettings {
  site_title?: string;
  site_description?: string;
  site_logo?: string;
  favicon?: string;
  meta_keywords?: string;
  meta_author?: string;
  contact_email?: string;
  business_hours?: string;
  social_github?: string;
  social_linkedin?: string;
  social_twitter?: string;
  social_instagram?: string;
  primary_color?: string;
  secondary_color?: string;
  font_family?: string;
  dark_mode?: boolean;
  show_animations?: boolean;
  posts_per_page?: number;
  projects_per_page?: number;
  enable_search?: boolean;
  enable_rss?: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<PublicSettings>({});
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get<{ data: PublicSettings }>('/settings');
      if (response.data?.data) {
        setSettings(response.data.data);
      }
    } catch {
      // 에러 처리
      toast.error('설정을 가져오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const renderSettingValue = (key: string, value: string | number | boolean | Record<string, unknown>) => {
    if (value === undefined || value === null || value === '') {
      return <span className="text-gray-400 italic">설정되지 않음</span>;
    }

    switch (typeof value) {
      case 'boolean':
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {value ? '활성화' : '비활성화'}
          </span>
        );
      
      case 'number':
        return <span className="font-mono text-blue-600">{value}</span>;
      
      case 'string':
        if (key.includes('color')) {
          return (
            <div className="flex items-center space-x-2">
              <div 
                className="w-6 h-6 rounded border border-gray-300" 
                style={{ backgroundColor: value }}
              ></div>
              <span className="font-mono text-sm">{value}</span>
            </div>
          );
        }
        if (key.includes('url') || key.includes('link')) {
          return (
            <a 
              href={value} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline break-all"
            >
              {value}
            </a>
          );
        }
        if (key.includes('email')) {
          return (
            <a 
              href={`mailto:${value}`}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              {value}
            </a>
          );
        }
        return <span className="text-gray-900">{value}</span>;
      
      default:
        return <span className="text-gray-900">{String(value)}</span>;
    }
  };

  const getSettingDescription = (key: string) => {
    const descriptions: { [key: string]: string } = {
      site_title: '사이트의 제목입니다.',
      site_description: '사이트에 대한 간단한 설명입니다.',
      site_logo: '사이트 로고 이미지의 경로입니다.',
      favicon: '브라우저 탭에 표시되는 아이콘입니다.',
      meta_keywords: '검색 엔진 최적화를 위한 키워드입니다.',
      meta_author: '사이트의 작성자 정보입니다.',
      contact_email: '연락처용 이메일 주소입니다.',
      business_hours: '업무 가능 시간입니다.',
      social_github: 'GitHub 프로필 링크입니다.',
      social_linkedin: 'LinkedIn 프로필 링크입니다.',
      social_twitter: 'Twitter 프로필 링크입니다.',
      social_instagram: 'Instagram 프로필 링크입니다.',
      primary_color: '사이트의 주요 색상입니다.',
      secondary_color: '사이트의 보조 색상입니다.',
      font_family: '사이트에서 사용하는 기본 폰트입니다.',
      dark_mode: '다크 모드 사용 여부입니다.',
      show_animations: '애니메이션 효과 표시 여부입니다.',
      posts_per_page: '페이지당 표시할 블로그 포스트 수입니다.',
      projects_per_page: '페이지당 표시할 프로젝트 수입니다.',
      enable_search: '검색 기능 사용 여부입니다.',
      enable_rss: 'RSS 피드 제공 여부입니다.'
    };
    
    return descriptions[key] || '설정 정보입니다.';
  };

  const groupSettings = () => {
    const groups: { [key: string]: { [key: string]: string | number | boolean | Record<string, unknown> } } = {
      '사이트 정보': {},
      '연락처 및 소셜': {},
      '디자인': {},
      '기능': {}
    };

    Object.entries(settings).forEach(([key, value]) => {
      if (key.startsWith('site_') || key.startsWith('meta_')) {
        groups['사이트 정보'][key] = value;
      } else if (key.startsWith('contact_') || key.startsWith('social_') || key.includes('email') || key.includes('hours')) {
        groups['연락처 및 소셜'][key] = value;
      } else if (key.includes('color') || key.includes('font') || key.includes('mode') || key.includes('animation')) {
        groups['디자인'][key] = value;
      } else {
        groups['기능'][key] = value;
      }
    });

    return groups;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">설정을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">오류가 발생했습니다</h1>
          <p className="text-gray-600">설정을 불러오는 중 오류가 발생했습니다.</p>
        </div>
      </div>
    );
  }

  const groupedSettings = groupSettings();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900">사이트 설정</h1>
            <p className="text-gray-600 mt-2">
              현재 사이트에 적용된 설정 정보를 확인할 수 있습니다.
            </p>
          </div>

          <div className="p-6">
            {Object.entries(groupedSettings).map(([groupName, groupSettings]) => {
              if (Object.keys(groupSettings).length === 0) return null;
              
              return (
                <div key={groupName} className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                    {groupName}
                  </h2>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    {Object.entries(groupSettings).map(([key, value]) => (
                      <div key={key} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-gray-700 mb-1">
                              {getSettingDescription(key)}
                            </h3>
                            <div className="text-xs text-gray-500 mb-2">
                              <code className="bg-gray-200 px-1 rounded">{key}</code>
                            </div>
                            <div className="text-sm">
                              {renderSettingValue(key, value)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">정보</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      이 페이지는 사이트의 공개 설정 정보를 보여줍니다. 
                      설정을 변경하려면 관리자 계정으로 로그인하여 관리자 페이지를 이용해주세요.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

