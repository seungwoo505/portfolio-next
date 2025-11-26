'use client';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { SiteSettings } from '@/types';
interface DynamicHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  author?: string;
  pageTitle?: string;
}
/**
 * @component DynamicHead
 * @description 사이트 설정과 전달된 값을 조합해 `<Head>` 메타데이터를 동적으로 구성합니다.
 * @param {DynamicHeadProps} props 제목, 설명 등 메타데이터 덮어쓰기 값.
 * @returns {JSX.Element | null} 설정을 로딩 중이면 null, 완료되면 메타 태그를 반환합니다.
 */
export default function DynamicHead({
  title,
  description,
  keywords,
  author,
  pageTitle
}: DynamicHeadProps) {
  const [settings, setSettings] = useState<SiteSettings>({});
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    /**
     * @function fetchSettings
     * @description 전역 사이트 설정을 조회하여 최종 메타데이터를 구성합니다.
     * @returns {Promise<void>} 설정 상태 갱신이 완료되면 해결됩니다.
     */
    const fetchSettings = async () => {
      try {
        const response = await api.get<{ data: SiteSettings }>('/settings');
        if (response.data?.data) {
          setSettings(response.data.data);
        }
      } catch {
        toast.error('설정을 가져오는데 실패했습니다');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);
  const finalTitle = pageTitle 
    ? `${pageTitle} | ${settings?.site_title || '승우 포트폴리오'}`
    : settings?.site_title || title || '승우 포트폴리오 | 웹 개발자';
  const finalDescription = settings?.site_description || description || '풀스택 웹 개발자 승우의 포트폴리오';
  const finalKeywords = settings?.meta_keywords || keywords || '개발자,포트폴리오,웹개발,프론트엔드,백엔드';
  const finalAuthor = settings?.meta_author || author || '승우';
  useEffect(() => {
    if (settings?.primary_color) {
      document.documentElement.style.setProperty('--custom-primary-color', settings.primary_color);
      document.documentElement.setAttribute('data-theme', 'custom');
    }
    if (settings?.secondary_color) {
      document.documentElement.style.setProperty('--custom-secondary-color', settings.secondary_color);
      document.documentElement.setAttribute('data-theme', 'custom');
    }
    if (settings?.font_family) {
      document.documentElement.style.setProperty('--custom-font-family', settings.font_family);
      document.documentElement.setAttribute('data-theme', 'custom');
    }
  }, [settings]);
  useEffect(() => {
    if (settings?.dark_mode !== undefined) {
      if (settings?.dark_mode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [settings?.dark_mode]);
  if (loading) {
    return null; 
  }
  return (
    <Head>
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={finalKeywords} />
      <meta name="author" content={finalAuthor} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={settings?.site_title || '승우 포트폴리오'} />
      <meta property="og:locale" content="ko_KR" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:creator" content="@seungwoo_dev" />
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : ''} />
      <meta name="format-detection" content="telephone=no" />
      <meta name="format-detection" content="date=no" />
      <meta name="format-detection" content="address=no" />
      <meta name="format-detection" content="email=no" />
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta charSet="utf-8" />
      {settings?.primary_color && (
        <meta name="theme-color" content={settings?.primary_color} />
      )}
    </Head>
  );
}
