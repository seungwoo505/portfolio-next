'use client';
import { Fragment, useState, useEffect } from 'react';
import { Heading } from '@/components/ui/heading';
import { DescriptionList, DescriptionTerm, DescriptionDetails } from '@/components/ui/description-list';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { SitePublicSettings } from '@/types';
/**
 * @component SettingsPage
 * @description 방문자가 확인할 수 있는 사이트 설정 정보를 조회하고 표시한다.
 * @returns {JSX.Element} 설정 정보 요약 페이지 컴포넌트.
 */
export default function SettingsPage() {
  const [settings, setSettings] = useState<SitePublicSettings>({});
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchSettings();
  }, []);
  /**
   * @function fetchSettings
   * @description API에서 사이트 설정 값을 가져와 상태를 갱신한다.
   * @returns {Promise<void>} 설정 로딩이 끝나면 해결되는 프로미스.
   */
  const fetchSettings = async () => {
    try {
      const response = await api.get<SitePublicSettings>('/settings');
      if (response.data) {
        setSettings(response.data);
      }
    } catch {
      toast.error('설정을 가져오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };
  /**
   * @function renderSettingValue
   * @description 설정 값 타입에 따라 적절한 렌더링 방식을 반환한다.
   * @param {string} key 설정 키.
   * @param {string | number | boolean | Record<string, unknown>} value 렌더링할 값.
   * @returns {JSX.Element} 렌더링 결과 요소.
   */
  const renderSettingValue = (key: string, value: string | number | boolean | Record<string, unknown>) => {
    if (value === undefined || value === null || value === '') {
      return <span className="muted-text italic">설정되지 않음</span>;
    }
    switch (typeof value) {
      case 'boolean':
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            value ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
          }`}>
            {value ? '활성화' : '비활성화'}
          </span>
        );
      case 'number':
        return <span className="font-mono text-teal-700 dark:text-teal-400">{value}</span>;
      case 'string':
        if (key.includes('color')) {
          return (
            <div className="flex items-center space-x-2">
              <div
                className="w-6 h-6 rounded border border-zinc-200 dark:border-zinc-700"
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
              className="text-teal-700 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300 underline break-all"
            >
              {value}
            </a>
          );
        }
        if (key.includes('email')) {
          return (
            <a
              href={`mailto:${value}`}
              className="text-teal-700 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300 underline"
            >
              {value}
            </a>
          );
        }
        return <span className="text-zinc-900 dark:text-zinc-100">{value}</span>;
      default:
        return <span className="text-zinc-900 dark:text-zinc-100">{String(value)}</span>;
    }
  };
  /**
   * @function getSettingDescription
   * @description 설정 키에 대응하는 설명 문구를 반환한다.
   * @param {string} key 설정 키.
   * @returns {string} 설명 문자열.
   */
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
  /**
   * @function groupSettings
   * @description 설정 항목들을 주제별 그룹으로 분류한다.
   * @returns {Record<string, Record<string, string | number | boolean | Record<string, unknown>>>} 그룹화된 설정 객체.
   */
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
    return <div className="site-container site-section" role="status"><p className="section-label">사이트 정보</p><h1 className="page-heading mt-5">사이트 설정</h1><p className="page-intro mt-6">설정을 불러오는 중입니다.</p></div>;
  }
  const groupedSettings = groupSettings();
  return (
    <div className="site-container site-section">
      <header className="max-w-2xl"><p className="section-label">사이트 정보</p><h1 className="page-heading mt-5">사이트 설정</h1><p className="page-intro mt-6">현재 사이트에 적용된 공개 설정을 확인할 수 있습니다.</p></header>
      <div className="mt-12 max-w-4xl space-y-10">
        {Object.entries(groupedSettings).map(([groupName, groupSettings]) => {
          if (Object.keys(groupSettings).length === 0) return null;
          return <section key={groupName} className="surface-card p-6 sm:p-8"><Heading level={2}>{groupName}</Heading><DescriptionList className="mt-6">
            {Object.entries(groupSettings).map(([key, value]) => <Fragment key={key}>
              <DescriptionTerm><span className="block text-sm text-zinc-700 dark:text-zinc-300">{getSettingDescription(key)}</span><code className="mt-1 block break-all text-xs text-zinc-400 dark:text-zinc-500">{key}</code></DescriptionTerm>
              <DescriptionDetails className="min-w-0 break-words">{renderSettingValue(key, value)}</DescriptionDetails>
            </Fragment>)}
          </DescriptionList></section>;
        })}
        {Object.keys(settings).length === 0 && <p className="surface-card p-8 muted-text">표시할 공개 설정이 없습니다.</p>}
        <p className="border-l-2 border-teal-600 pl-5 text-sm leading-7 muted-text">이 페이지는 사이트의 공개 설정 정보를 보여줍니다. 설정을 변경하려면 관리자 계정으로 로그인하여 관리자 페이지를 이용해 주세요.</p>
      </div>
    </div>
  );
}
